"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstallationReportsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("../../prisma/prisma.service");
const redis_service_1 = require("../../redis/redis.service");
const date_time_1 = require("../../common/utils/date-time");
const settings_service_1 = require("../settings/settings.service");
const pdf_service_1 = require("../pdf/pdf.service");
const document_template_service_1 = require("../pdf/templates/document-template.service");
const installation_report_template_1 = require("../pdf/templates/installation-report.template");
const master_mills_service_1 = require("../master-mills/master-mills.service");
const INCLUDE_SHAPE = {
    mill: {
        select: {
            id: true,
            name: true,
            customer: { select: { id: true, name: true } },
        },
    },
    technicians: {
        include: { technician: { select: { id: true, full_name: true } } },
    },
};
const createDateBoundary = (dateValue, boundary) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);
    if (!match)
        return null;
    const [, year, month, day] = match;
    const yearValue = Number(year);
    const monthValue = Number(month);
    const dayValue = Number(day);
    const dateOnly = new Date(Date.UTC(yearValue, monthValue - 1, dayValue));
    if (dateOnly.getUTCFullYear() !== yearValue ||
        dateOnly.getUTCMonth() !== monthValue - 1 ||
        dateOnly.getUTCDate() !== dayValue) {
        return null;
    }
    const kolkataOffsetMs = 5.5 * 60 * 60 * 1000;
    const utcTime = Date.UTC(yearValue, monthValue - 1, dayValue, boundary === 'start' ? 0 : 23, boundary === 'start' ? 0 : 59, boundary === 'start' ? 0 : 59, boundary === 'start' ? 0 : 999);
    const date = new Date(utcTime - kolkataOffsetMs);
    if (Number.isNaN(date.getTime()))
        return null;
    return date;
};
let InstallationReportsService = class InstallationReportsService {
    prisma;
    redis;
    settingsService;
    pdfService;
    documentTemplateService;
    eventEmitter;
    masterMillsService;
    CACHE_PREFIX = 'installation-report:';
    LIST_CACHE_KEY = 'installation-reports:list:';
    constructor(prisma, redis, settingsService, pdfService, documentTemplateService, eventEmitter, masterMillsService) {
        this.prisma = prisma;
        this.redis = redis;
        this.settingsService = settingsService;
        this.pdfService = pdfService;
        this.documentTemplateService = documentTemplateService;
        this.eventEmitter = eventEmitter;
        this.masterMillsService = masterMillsService;
    }
    enrichReportWithAmc(report, masterMill) {
        if (!report)
            return report;
        let amcStartDate = masterMill?.amc_starting_date
            ? masterMill.amc_starting_date instanceof Date
                ? masterMill.amc_starting_date.toISOString()
                : masterMill.amc_starting_date
            : null;
        let amcClosingDate = masterMill?.amc_closing_date
            ? masterMill.amc_closing_date instanceof Date
                ? masterMill.amc_closing_date.toISOString()
                : masterMill.amc_closing_date
            : null;
        const amcPeriod = masterMill?.amc_period !== undefined && masterMill?.amc_period !== null
            ? Number(masterMill.amc_period)
            : null;
        if (!amcStartDate && amcPeriod && amcPeriod > 0) {
            const wEnd = report.warranty_end_date ||
                masterMill?.warranty_closing_date;
            if (wEnd) {
                const autoStart = new Date(wEnd);
                autoStart.setDate(autoStart.getDate() + 1);
                amcStartDate = autoStart.toISOString();
                if (!amcClosingDate) {
                    const autoClose = new Date(autoStart);
                    autoClose.setMonth(autoClose.getMonth() + amcPeriod);
                    autoClose.setDate(autoClose.getDate() - 1);
                    amcClosingDate = autoClose.toISOString();
                }
            }
        }
        return {
            ...report,
            amc_period: amcPeriod,
            amc_start_date: amcStartDate,
            amc_starting_date: amcStartDate,
            amc_closing_date: amcClosingDate,
            amc_amount: masterMill?.amc_amount ? Number(masterMill.amc_amount) : null,
            amc_particular: masterMill?.amc_particular ?? null,
            amc_particulars: masterMill?.amc_particular ?? null,
        };
    }
    async fetchMasterMillForReport(report) {
        if (!report)
            return null;
        let masterMill = null;
        if (report.serial_or_frame_no) {
            masterMill = await this.prisma.masterMill.findFirst({
                where: {
                    deleted_at: null,
                    frame_no: report.serial_or_frame_no,
                },
            });
        }
        if (!masterMill && report.invoice_number) {
            masterMill = await this.prisma.masterMill.findFirst({
                where: {
                    deleted_at: null,
                    invoice_no: report.invoice_number,
                },
            });
        }
        if (!masterMill && report.mill_id) {
            masterMill = await this.prisma.masterMill.findFirst({
                where: {
                    deleted_at: null,
                    mill_id: report.mill_id,
                },
            });
        }
        return masterMill;
    }
    async findAll(params, user) {
        const cacheKey = `${this.LIST_CACHE_KEY}${JSON.stringify({ params, user })}`;
        const cachedData = await this.redis.getJson(cacheKey);
        if (cachedData)
            return cachedData;
        const { skip, take, search, status, technicianId, customerId, millId, dateFrom, dateTo, expenseEligibleOnly, excludeExpenseId, } = params;
        const where = { deleted_at: null };
        if (user && user.role === 'Service Engineer') {
            where.technicians = {
                some: {
                    technician_id: user.userId,
                },
            };
        }
        if (search) {
            where.OR = [
                { report_number: { contains: search, mode: 'insensitive' } },
                { place: { contains: search, mode: 'insensitive' } },
                { machine_model: { contains: search, mode: 'insensitive' } },
                { serial_or_frame_no: { contains: search, mode: 'insensitive' } },
                { authorized_person: { contains: search, mode: 'insensitive' } },
                { mill: { name: { contains: search, mode: 'insensitive' } } },
            ];
        }
        if (status) {
            where.status = status;
        }
        if (millId) {
            where.mill_id = millId;
        }
        if (customerId) {
            where.mill = { customer_id: customerId };
        }
        if (technicianId) {
            if (user && user.role === 'Service Engineer') {
                where.technicians = {
                    some: {
                        technician_id: user.userId,
                    },
                };
            }
            else {
                where.technicians = {
                    some: {
                        technician_id: technicianId,
                    },
                };
            }
        }
        if (dateFrom || dateTo) {
            where.visit_date = {};
            if (dateFrom) {
                const fromDate = createDateBoundary(dateFrom, 'start');
                if (fromDate) {
                    where.visit_date.gte = fromDate;
                }
            }
            if (dateTo || dateFrom) {
                const toDate = createDateBoundary(dateTo || dateFrom, 'end');
                if (toDate) {
                    where.visit_date.lte = toDate;
                }
            }
            if (Object.keys(where.visit_date).length === 0) {
                delete where.visit_date;
            }
        }
        if (expenseEligibleOnly) {
            where.AND = [
                ...(where.AND || []),
                {
                    OR: [
                        { expense_id: null },
                        ...(excludeExpenseId ? [{ expense_id: excludeExpenseId }] : []),
                    ],
                },
                {
                    expenses: {
                        none: {
                            deleted_at: null,
                            ...(excludeExpenseId ? { NOT: { id: excludeExpenseId } } : {}),
                        },
                    },
                },
            ];
        }
        const [installationReports, total] = await Promise.all([
            this.prisma.installationReport.findMany({
                skip,
                take,
                where,
                include: INCLUDE_SHAPE,
                orderBy: { created_at: 'desc' },
            }),
            this.prisma.installationReport.count({ where }),
        ]);
        const frameNos = installationReports
            .map((r) => r.serial_or_frame_no)
            .filter((f) => Boolean(f));
        const invoiceNos = installationReports
            .map((r) => r.invoice_number)
            .filter((n) => Boolean(n));
        const millIds = installationReports
            .map((r) => r.mill_id)
            .filter((m) => Boolean(m));
        const masterMills = await this.prisma.masterMill.findMany({
            where: {
                deleted_at: null,
                OR: [
                    ...(frameNos.length > 0 ? [{ frame_no: { in: frameNos } }] : []),
                    ...(invoiceNos.length > 0 ? [{ invoice_no: { in: invoiceNos } }] : []),
                    ...(millIds.length > 0 ? [{ mill_id: { in: millIds } }] : []),
                ],
            },
        });
        const mmByFrame = new Map();
        const mmByInvoice = new Map();
        const mmByMill = new Map();
        for (const mm of masterMills) {
            if (mm.frame_no)
                mmByFrame.set(mm.frame_no, mm);
            if (mm.invoice_no)
                mmByInvoice.set(mm.invoice_no, mm);
            if (mm.mill_id && !mmByMill.has(mm.mill_id))
                mmByMill.set(mm.mill_id, mm);
        }
        const enrichedReports = installationReports.map((r) => {
            const mm = (r.serial_or_frame_no ? mmByFrame.get(r.serial_or_frame_no) : null) ||
                (r.invoice_number ? mmByInvoice.get(r.invoice_number) : null) ||
                (r.mill_id ? mmByMill.get(r.mill_id) : null);
            return this.enrichReportWithAmc(r, mm);
        });
        const result = { installationReports: enrichedReports, total };
        await this.redis.setJson(cacheKey, result, 300);
        return result;
    }
    async findById(id, user) {
        const cacheKey = `${this.CACHE_PREFIX}id:${id}:${user?.userId || 'all'}`;
        const cached = await this.redis.getJson(cacheKey);
        if (cached)
            return cached;
        const installationReport = await this.prisma.installationReport.findFirst({
            where: { id, deleted_at: null },
            include: INCLUDE_SHAPE,
        });
        if (!installationReport) {
            throw new common_1.NotFoundException(`Installation report with ID "${id}" not found`);
        }
        if (user && user.role === 'Service Engineer') {
            const isAssigned = installationReport.technicians.some((t) => t.technician_id === user.userId);
            if (!isAssigned) {
                throw new common_1.ForbiddenException('You do not have permission to access this installation report');
            }
        }
        const masterMill = await this.fetchMasterMillForReport(installationReport);
        const enriched = this.enrichReportWithAmc(installationReport, masterMill);
        await this.redis.setJson(cacheKey, enriched, 3600);
        return enriched;
    }
    async create(dto, user) {
        const rawDto = dto;
        let mill = null;
        if (rawDto.mill_id) {
            mill = await this.prisma.mill.findUnique({
                where: { id: rawDto.mill_id },
                select: { id: true, phone: true, email: true },
            });
            if (!mill) {
                throw new common_1.BadRequestException(`Mill with ID "${rawDto.mill_id}" not found. Please provide a valid mill_id.`);
            }
            if (!rawDto.mill_whatsapp_number) {
                rawDto.mill_whatsapp_number = mill.phone || '';
            }
            if (!rawDto.mill_email) {
                rawDto.mill_email = mill.email || '';
            }
        }
        const amcData = {
            amc_period: rawDto.amc_period !== undefined && rawDto.amc_period !== null
                ? Number(rawDto.amc_period)
                : undefined,
            amc_start_date: rawDto.amc_start_date || rawDto.amc_starting_date,
            amc_closing_date: rawDto.amc_closing_date,
            amc_amount: rawDto.amc_amount !== undefined && rawDto.amc_amount !== null
                ? Number(rawDto.amc_amount)
                : undefined,
            amc_particular: rawDto.amc_particular || rawDto.amc_particulars,
        };
        const { technician_ids, ...reportData } = rawDto;
        delete reportData.customer_id;
        delete reportData.technician_id;
        delete reportData.amc_period;
        delete reportData.amc_start_date;
        delete reportData.amc_starting_date;
        delete reportData.amc_closing_date;
        delete reportData.amc_amount;
        delete reportData.amc_particular;
        delete reportData.amc_particulars;
        const candidateTechnicianIds = [...(technician_ids || [])];
        if (rawDto.technician_id &&
            !candidateTechnicianIds.includes(rawDto.technician_id)) {
            candidateTechnicianIds.push(rawDto.technician_id);
        }
        if (user &&
            user.role === 'Service Engineer' &&
            !candidateTechnicianIds.includes(user.userId)) {
            candidateTechnicianIds.push(user.userId);
        }
        let finalTechnicianIds = [];
        if (candidateTechnicianIds.length > 0) {
            const validTechs = await this.prisma.technician.findMany({
                where: { id: { in: candidateTechnicianIds } },
                select: { id: true },
            });
            const validTechSet = new Set(validTechs.map((t) => t.id));
            finalTechnicianIds = candidateTechnicianIds.filter((id) => validTechSet.has(id));
        }
        if (user &&
            user.userId &&
            !finalTechnicianIds.includes(user.userId)) {
            const userIsTech = await this.prisma.technician.findUnique({
                where: { id: user.userId },
                select: { id: true },
            });
            if (userIsTech) {
                finalTechnicianIds.push(user.userId);
            }
        }
        let installationReport;
        try {
            installationReport = await this.prisma.$transaction(async (tx) => {
                const todayStart = new Date();
                todayStart.setUTCHours(0, 0, 0, 0);
                const todayEnd = new Date();
                todayEnd.setUTCHours(23, 59, 59, 999);
                const count = await tx.installationReport.count({
                    where: { created_at: { gte: todayStart, lte: todayEnd } },
                });
                const dateStr = todayStart.toISOString().slice(0, 10).replace(/-/g, '');
                const seq = String(count + 1);
                const report_number = `IR-${dateStr}-${seq}`;
                const wYears = reportData.warranty_years ?? 0;
                const wMonths = reportData.warranty_months ?? 0;
                const wStartDate = reportData.warranty_start_date && reportData.warranty_start_date.trim()
                    ? new Date(reportData.warranty_start_date)
                    : undefined;
                let wEndDate = reportData.warranty_end_date && reportData.warranty_end_date.trim()
                    ? new Date(reportData.warranty_end_date)
                    : undefined;
                const totalMonths = wMonths + wYears * 12;
                if (!wEndDate && wStartDate && totalMonths > 0) {
                    const calcDate = new Date(wStartDate);
                    calcDate.setMonth(calcDate.getMonth() + totalMonths);
                    calcDate.setDate(calcDate.getDate() - 1);
                    wEndDate = calcDate;
                }
                const created = await tx.installationReport.create({
                    data: {
                        ...reportData,
                        report_number,
                        visit_time: reportData.visit_time && reportData.visit_time.trim()
                            ? reportData.visit_time
                            : (0, date_time_1.getAutoVisitTime)(),
                        visit_date: reportData.visit_date
                            ? new Date(reportData.visit_date)
                            : new Date(),
                        call_registered_date: new Date(reportData.call_registered_date),
                        machine_mfg_date: reportData.machine_mfg_date && reportData.machine_mfg_date.trim()
                            ? new Date(reportData.machine_mfg_date)
                            : undefined,
                        invoice_date: reportData.invoice_date && reportData.invoice_date.trim()
                            ? new Date(reportData.invoice_date)
                            : undefined,
                        customer_signature: reportData.customer_signature || '',
                        warranty_start_date: wStartDate,
                        warranty_end_date: wEndDate,
                        warranty_years: wYears,
                        warranty_months: wMonths,
                    },
                    include: INCLUDE_SHAPE,
                });
                if (finalTechnicianIds.length > 0) {
                    await tx.installationReportTechnician.createMany({
                        data: finalTechnicianIds.map((tid) => ({
                            installation_report_id: created.id,
                            technician_id: tid,
                        })),
                    });
                }
                return tx.installationReport.findFirst({
                    where: { id: created.id },
                    include: INCLUDE_SHAPE,
                });
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2003') {
                    throw new common_1.BadRequestException('Invalid reference: mill_id or technician_id does not exist in the database.');
                }
            }
            throw error;
        }
        await this.invalidateCache();
        if (installationReport) {
            void this.masterMillsService.syncFromInstallationReport({
                millId: installationReport.mill_id,
                frameNo: installationReport.serial_or_frame_no,
                mcModel: installationReport.machine_model,
                mfgDate: installationReport.machine_mfg_date,
                installationDate: installationReport.visit_date,
                invoiceNo: installationReport.invoice_number,
                invoiceDate: installationReport.invoice_date,
                warrantyYears: installationReport.warranty_years,
                warrantyMonths: installationReport.warranty_months,
                warrantyStartDate: installationReport.warranty_start_date,
                warrantyClosingDate: installationReport.warranty_end_date,
                amcStartingDate: amcData.amc_start_date
                    ? new Date(amcData.amc_start_date)
                    : undefined,
                amcClosingDate: amcData.amc_closing_date
                    ? new Date(amcData.amc_closing_date)
                    : undefined,
                amcPeriod: amcData.amc_period,
                amcParticular: amcData.amc_particular,
                amcAmount: amcData.amc_amount,
                place: installationReport.place,
            });
            this.eventEmitter.emit('installation-report.created', {
                reportId: installationReport.id,
                reportNumber: installationReport.report_number,
                millName: installationReport.mill?.name || '',
                technicianUserIds: finalTechnicianIds,
                creatorUserId: user?.userId,
            });
            this.eventEmitter.emit('installation-report.created.send-pdf', {
                reportId: installationReport.id,
                reportNumber: installationReport.report_number,
                millId: installationReport.mill?.id,
                millName: installationReport.mill?.name || '',
                millWhatsappNumber: rawDto.mill_whatsapp_number,
                millEmail: rawDto.mill_email,
                authorizedPersonPhone: rawDto.authorized_person_phone,
            });
        }
        const masterMill = await this.fetchMasterMillForReport(installationReport);
        return this.enrichReportWithAmc(installationReport, masterMill);
    }
    async update(id, dto, user) {
        const existingReport = await this.findById(id, user);
        const rawDto = dto;
        if ((!rawDto.mill_whatsapp_number || !rawDto.mill_email) &&
            rawDto.mill_id) {
            const mill = await this.prisma.mill.findUnique({
                where: { id: rawDto.mill_id },
                select: { phone: true, email: true },
            });
            if (!rawDto.mill_whatsapp_number) {
                rawDto.mill_whatsapp_number = mill?.phone || '';
            }
            if (!rawDto.mill_email) {
                rawDto.mill_email = mill?.email || '';
            }
        }
        const amcData = {
            amc_period: rawDto.amc_period !== undefined && rawDto.amc_period !== null
                ? Number(rawDto.amc_period)
                : undefined,
            amc_start_date: rawDto.amc_start_date || rawDto.amc_starting_date,
            amc_closing_date: rawDto.amc_closing_date,
            amc_amount: rawDto.amc_amount !== undefined && rawDto.amc_amount !== null
                ? Number(rawDto.amc_amount)
                : undefined,
            amc_particular: rawDto.amc_particular || rawDto.amc_particulars,
        };
        const { technician_ids, ...reportData } = rawDto;
        delete reportData.customer_id;
        delete reportData.technician_id;
        delete reportData.amc_period;
        delete reportData.amc_start_date;
        delete reportData.amc_starting_date;
        delete reportData.amc_closing_date;
        delete reportData.amc_amount;
        delete reportData.amc_particular;
        delete reportData.amc_particulars;
        let finalTechnicianIds = technician_ids !== undefined ? [...technician_ids] : undefined;
        if (rawDto.technician_id !== undefined) {
            if (finalTechnicianIds !== undefined) {
                if (rawDto.technician_id &&
                    !finalTechnicianIds.includes(rawDto.technician_id)) {
                    finalTechnicianIds.push(rawDto.technician_id);
                }
            }
            else {
                finalTechnicianIds = rawDto.technician_id ? [rawDto.technician_id] : [];
            }
        }
        const updateData = { ...reportData };
        if (reportData.visit_time !== undefined) {
            updateData.visit_time =
                reportData.visit_time && reportData.visit_time.trim()
                    ? reportData.visit_time
                    : (0, date_time_1.getAutoVisitTime)();
        }
        if (reportData.visit_date !== undefined) {
            updateData.visit_date = new Date(reportData.visit_date);
        }
        if (reportData.call_registered_date !== undefined) {
            updateData.call_registered_date = new Date(reportData.call_registered_date);
        }
        if (reportData.invoice_date !== undefined) {
            updateData.invoice_date =
                reportData.invoice_date && reportData.invoice_date.trim()
                    ? new Date(reportData.invoice_date)
                    : null;
        }
        if (reportData.machine_mfg_date !== undefined) {
            updateData.machine_mfg_date =
                reportData.machine_mfg_date && reportData.machine_mfg_date.trim()
                    ? new Date(reportData.machine_mfg_date)
                    : null;
        }
        if (reportData.warranty_start_date !== undefined) {
            updateData.warranty_start_date =
                reportData.warranty_start_date && reportData.warranty_start_date.trim()
                    ? new Date(reportData.warranty_start_date)
                    : null;
        }
        if (reportData.warranty_end_date !== undefined) {
            updateData.warranty_end_date =
                reportData.warranty_end_date && reportData.warranty_end_date.trim()
                    ? new Date(reportData.warranty_end_date)
                    : null;
        }
        if (reportData.warranty_months !== undefined) {
            updateData.warranty_months = reportData.warranty_months ?? 0;
        }
        if (!updateData.warranty_end_date &&
            (reportData.warranty_start_date !== undefined ||
                reportData.warranty_years !== undefined ||
                reportData.warranty_months !== undefined)) {
            const startDate = updateData.warranty_start_date !== undefined
                ? updateData.warranty_start_date
                : existingReport.warranty_start_date;
            const years = updateData.warranty_years !== undefined
                ? updateData.warranty_years
                : (existingReport.warranty_years ?? 0);
            const months = updateData.warranty_months !== undefined
                ? updateData.warranty_months
                : (existingReport.warranty_months ?? 0);
            const totalMonths = (months ?? 0) + (years ?? 0) * 12;
            if (startDate && totalMonths > 0) {
                const calcDate = new Date(startDate);
                calcDate.setMonth(calcDate.getMonth() + totalMonths);
                calcDate.setDate(calcDate.getDate() - 1);
                updateData.warranty_end_date = calcDate;
            }
        }
        const installationReport = await this.prisma.installationReport.update({
            where: { id },
            data: updateData,
            include: INCLUDE_SHAPE,
        });
        if (finalTechnicianIds !== undefined) {
            await this.prisma.installationReportTechnician.deleteMany({
                where: { installation_report_id: id },
            });
            await this.prisma.installationReportTechnician.createMany({
                data: finalTechnicianIds.map((tid) => ({
                    installation_report_id: id,
                    technician_id: tid,
                })),
            });
        }
        void this.masterMillsService.syncFromInstallationReport({
            millId: installationReport.mill_id,
            frameNo: installationReport.serial_or_frame_no,
            mcModel: installationReport.machine_model,
            mfgDate: installationReport.machine_mfg_date,
            installationDate: installationReport.visit_date,
            invoiceNo: installationReport.invoice_number,
            invoiceDate: installationReport.invoice_date,
            warrantyYears: installationReport.warranty_years,
            warrantyMonths: installationReport.warranty_months,
            warrantyStartDate: installationReport.warranty_start_date,
            warrantyClosingDate: installationReport.warranty_end_date,
            amcStartingDate: amcData.amc_start_date
                ? new Date(amcData.amc_start_date)
                : undefined,
            amcClosingDate: amcData.amc_closing_date
                ? new Date(amcData.amc_closing_date)
                : undefined,
            amcPeriod: amcData.amc_period,
            amcParticular: amcData.amc_particular,
            amcAmount: amcData.amc_amount,
            place: installationReport.place,
        });
        await this.invalidateCache(id);
        const masterMill = await this.fetchMasterMillForReport(installationReport);
        const enrichedAfter = this.enrichReportWithAmc(installationReport, masterMill);
        return { before: existingReport, after: enrichedAfter };
    }
    async remove(id, user) {
        await this.findById(id, user);
        const installationReport = await this.prisma.installationReport.update({
            where: { id },
            data: { deleted_at: new Date() },
            include: INCLUDE_SHAPE,
        });
        await this.invalidateCache(id);
        return installationReport;
    }
    async bulkDeleteByDate(startDate, endDate, user) {
        const where = { deleted_at: null };
        if (startDate || endDate) {
            where.created_at = {};
            if (startDate) {
                const start = new Date(startDate);
                start.setUTCHours(0, 0, 0, 0);
                where.created_at.gte = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setUTCHours(23, 59, 59, 999);
                where.created_at.lte = end;
            }
        }
        const result = await this.prisma.installationReport.updateMany({
            where,
            data: {
                deleted_at: new Date(),
            },
        });
        await this.invalidateCache();
        let rangeStr = '';
        if (startDate && endDate)
            rangeStr = `between ${startDate} and ${endDate}`;
        else if (startDate)
            rangeStr = `from ${startDate} onwards`;
        else if (endDate)
            rangeStr = `on or before ${endDate}`;
        return {
            count: result.count,
            message: `Successfully deleted ${result.count} installation report(s) ${rangeStr}`.trim(),
        };
    }
    async invalidateCache(id) {
        const promises = [
            this.redis.delByPrefix(this.LIST_CACHE_KEY),
            this.redis.delByPrefix('reports:'),
        ];
        if (id) {
            promises.push(this.redis.delByPrefix(`${this.CACHE_PREFIX}id:${id}`));
        }
        await Promise.all(promises);
    }
    async generatePdf(id, user) {
        const report = await this.findById(id, user);
        const company = await this.getCompanyPdfSettings();
        company.logoUrl = await this.pdfService.embedImageAsDataUrl(company.logoUrl);
        const html = (0, installation_report_template_1.renderInstallationReportTemplate)({ report, company }, this.documentTemplateService);
        const buffer = await this.pdfService.renderHtmlToPdf(html, (0, installation_report_template_1.renderInstallationReportPdfOptions)(company, this.documentTemplateService));
        return {
            buffer,
            fileName: `installation-report-${report.report_number}.pdf`,
        };
    }
    async getCompanyPdfSettings() {
        const data = await this.settingsService.findAll({
            skip: 0,
            take: 200,
            group: 'COMPANY',
        });
        const settings = new Map(data.settings.map((setting) => [
            setting.key,
            setting.value,
        ]));
        return {
            logoUrl: settings.get('COMPANY_HEADER_LOGO_URL') || '',
            name: settings.get('COMPANY_NAME') || 'Mendo controls',
            partnerDescription: settings.get('COMPANY_PARTNER_DESCRIPTION') || '',
            addressLine1: settings.get('COMPANY_ADDRESS_LINE_1') || '',
            addressLine2: settings.get('COMPANY_ADDRESS_LINE_2') || '',
            region: settings.get('COMPANY_REGION') || '',
            email: settings.get('COMPANY_EMAIL') || '',
            tollFree: settings.get('COMPANY_TOLL_FREE') || '',
            cellNumbers: settings.get('COMPANY_CELL_NUMBERS') || '',
            gstNo: settings.get('COMPANY_GST_NO') || '',
        };
    }
};
exports.InstallationReportsService = InstallationReportsService;
exports.InstallationReportsService = InstallationReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        settings_service_1.SettingsService,
        pdf_service_1.PdfService,
        document_template_service_1.DocumentTemplateService,
        event_emitter_1.EventEmitter2,
        master_mills_service_1.MasterMillsService])
], InstallationReportsService);
//# sourceMappingURL=installation-reports.service.js.map