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
exports.ServiceReportsService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("../../prisma/prisma.service");
const redis_service_1 = require("../../redis/redis.service");
const date_time_1 = require("../../common/utils/date-time");
const settings_service_1 = require("../settings/settings.service");
const pdf_service_1 = require("../pdf/pdf.service");
const document_template_service_1 = require("../pdf/templates/document-template.service");
const service_report_template_1 = require("../pdf/templates/service-report.template");
const INCLUDE_SHAPE = {
    mill: {
        select: {
            id: true,
            name: true,
            customer: { select: { id: true, name: true } },
        },
    },
    serviceCategory: { select: { id: true, name: true } },
    technicians: {
        include: { technician: { select: { id: true, full_name: true } } },
    },
};
let ServiceReportsService = class ServiceReportsService {
    prisma;
    redis;
    settingsService;
    pdfService;
    documentTemplateService;
    eventEmitter;
    CACHE_PREFIX = 'service-report:';
    LIST_CACHE_KEY = 'service-reports:list:';
    constructor(prisma, redis, settingsService, pdfService, documentTemplateService, eventEmitter) {
        this.prisma = prisma;
        this.redis = redis;
        this.settingsService = settingsService;
        this.pdfService = pdfService;
        this.documentTemplateService = documentTemplateService;
        this.eventEmitter = eventEmitter;
    }
    async findAll(params, user) {
        const cacheKey = `${this.LIST_CACHE_KEY}${JSON.stringify({ params, user })}`;
        const cachedData = await this.redis.getJson(cacheKey);
        if (cachedData)
            return cachedData;
        const { skip, take, search, status, serviceCategoryId, technicianId, customerId, millId, dateFrom, dateTo, expenseEligibleOnly, excludeExpenseId, } = params;
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
                { nature_of_complaint: { contains: search, mode: 'insensitive' } },
                { authorized_person: { contains: search, mode: 'insensitive' } },
                { mill: { name: { contains: search, mode: 'insensitive' } } },
                {
                    mill: {
                        customer: {
                            name: { contains: search, mode: 'insensitive' },
                        },
                    },
                },
                {
                    serviceCategory: {
                        name: { contains: search, mode: 'insensitive' },
                    },
                },
                {
                    technicians: {
                        some: {
                            technician: {
                                full_name: { contains: search, mode: 'insensitive' },
                            },
                        },
                    },
                },
            ];
        }
        if (status) {
            where.status = status;
        }
        if (serviceCategoryId) {
            where.service_category_id = serviceCategoryId;
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
                const [fy, fm, fd] = dateFrom.split('-').map(Number);
                const fromDate = new Date(fy, fm - 1, fd, 0, 0, 0, 0);
                where.visit_date.gte = fromDate;
            }
            if (dateTo) {
                const [ty, tm, td] = dateTo.split('-').map(Number);
                const toDate = new Date(ty, tm - 1, td, 23, 59, 59, 999);
                where.visit_date.lte = toDate;
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
        const [serviceReports, total] = await Promise.all([
            this.prisma.serviceReport.findMany({
                skip,
                take,
                where,
                include: INCLUDE_SHAPE,
                orderBy: { created_at: 'desc' },
            }),
            this.prisma.serviceReport.count({ where }),
        ]);
        const result = { serviceReports, total };
        await this.redis.setJson(cacheKey, result, 300);
        return result;
    }
    async findById(id, user) {
        const cacheKey = `${this.CACHE_PREFIX}id:${id}:${user?.userId || 'all'}`;
        const cached = await this.redis.getJson(cacheKey);
        if (cached)
            return cached;
        const serviceReport = await this.prisma.serviceReport.findFirst({
            where: { id, deleted_at: null },
            include: INCLUDE_SHAPE,
        });
        if (!serviceReport) {
            throw new common_1.NotFoundException(`Service report with ID "${id}" not found`);
        }
        if (user && user.role === 'Service Engineer') {
            const isAssigned = serviceReport.technicians.some((t) => t.technician_id === user.userId);
            if (!isAssigned) {
                throw new common_1.ForbiddenException('You do not have permission to access this service report');
            }
        }
        await this.redis.setJson(cacheKey, serviceReport, 3600);
        return serviceReport;
    }
    async create(dto, user) {
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
        const { technician_ids, ...reportData } = rawDto;
        delete reportData.customer_id;
        delete reportData.technician_id;
        const finalTechnicianIds = [...(technician_ids || [])];
        if (rawDto.technician_id &&
            !finalTechnicianIds.includes(rawDto.technician_id)) {
            finalTechnicianIds.push(rawDto.technician_id);
        }
        if (user &&
            user.role === 'Service Engineer' &&
            !finalTechnicianIds.includes(user.userId)) {
            finalTechnicianIds.push(user.userId);
        }
        const serviceReport = await this.prisma.$transaction(async (tx) => {
            const todayStart = new Date();
            todayStart.setUTCHours(0, 0, 0, 0);
            const todayEnd = new Date();
            todayEnd.setUTCHours(23, 59, 59, 999);
            const count = await tx.serviceReport.count({
                where: { created_at: { gte: todayStart, lte: todayEnd } },
            });
            const dateStr = todayStart.toISOString().slice(0, 10).replace(/-/g, '');
            const seq = String(count + 1);
            const report_number = `SR-${dateStr}-${seq}`;
            const created = await tx.serviceReport.create({
                data: {
                    ...reportData,
                    report_number,
                    visit_time: reportData.visit_time && reportData.visit_time.trim()
                        ? reportData.visit_time
                        : (0, date_time_1.getAutoVisitTime)(),
                    visit_date: new Date(reportData.visit_date),
                    call_registered_date: new Date(reportData.call_registered_date),
                    machine_mfg_date: reportData.machine_mfg_date && reportData.machine_mfg_date.trim()
                        ? new Date(reportData.machine_mfg_date)
                        : undefined,
                    machine_installation_date: reportData.machine_installation_date &&
                        reportData.machine_installation_date.trim()
                        ? new Date(reportData.machine_installation_date)
                        : undefined,
                },
                include: INCLUDE_SHAPE,
            });
            await tx.serviceReportTechnician.createMany({
                data: finalTechnicianIds.map((tid) => ({
                    service_report_id: created.id,
                    technician_id: tid,
                })),
            });
            return tx.serviceReport.findFirst({
                where: { id: created.id },
                include: INCLUDE_SHAPE,
            });
        });
        await this.invalidateCache();
        if (serviceReport) {
            this.eventEmitter.emit('service-report.created', {
                reportNumber: serviceReport.report_number,
                millName: serviceReport.mill?.name || '',
                technicianUserIds: finalTechnicianIds,
                creatorUserId: user?.userId,
            });
            this.eventEmitter.emit('service-report.created.send-pdf', {
                reportId: serviceReport.id,
                reportNumber: serviceReport.report_number,
                millId: serviceReport.mill?.id,
                millName: serviceReport.mill?.name || '',
                millWhatsappNumber: rawDto.mill_whatsapp_number,
                millEmail: rawDto.mill_email,
            });
        }
        return serviceReport;
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
        const { technician_ids, ...reportData } = rawDto;
        delete reportData.customer_id;
        delete reportData.technician_id;
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
        if (reportData.machine_mfg_date !== undefined) {
            updateData.machine_mfg_date =
                reportData.machine_mfg_date && reportData.machine_mfg_date.trim()
                    ? new Date(reportData.machine_mfg_date)
                    : null;
        }
        if (reportData.machine_installation_date !== undefined) {
            updateData.machine_installation_date =
                reportData.machine_installation_date &&
                    reportData.machine_installation_date.trim()
                    ? new Date(reportData.machine_installation_date)
                    : null;
        }
        const serviceReport = await this.prisma.serviceReport.update({
            where: { id },
            data: updateData,
            include: INCLUDE_SHAPE,
        });
        if (finalTechnicianIds !== undefined) {
            await this.prisma.serviceReportTechnician.deleteMany({
                where: { service_report_id: id },
            });
            await this.prisma.serviceReportTechnician.createMany({
                data: finalTechnicianIds.map((tid) => ({
                    service_report_id: id,
                    technician_id: tid,
                })),
            });
        }
        await this.invalidateCache(id);
        return { before: existingReport, after: serviceReport };
    }
    async remove(id, user) {
        await this.findById(id, user);
        const serviceReport = await this.prisma.serviceReport.update({
            where: { id },
            data: { deleted_at: new Date() },
            include: INCLUDE_SHAPE,
        });
        await this.invalidateCache(id);
        return serviceReport;
    }
    async generatePdf(id, user) {
        const report = await this.findById(id, user);
        const company = await this.getCompanyPdfSettings();
        company.logoUrl = await this.pdfService.embedImageAsDataUrl(company.logoUrl);
        const html = (0, service_report_template_1.renderServiceReportTemplate)({ report, company }, this.documentTemplateService);
        const buffer = await this.pdfService.renderHtmlToPdf(html, (0, service_report_template_1.renderServiceReportPdfOptions)(company, this.documentTemplateService));
        return {
            buffer,
            fileName: `service-report-${report.report_number}.pdf`,
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
};
exports.ServiceReportsService = ServiceReportsService;
exports.ServiceReportsService = ServiceReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        settings_service_1.SettingsService,
        pdf_service_1.PdfService,
        document_template_service_1.DocumentTemplateService,
        event_emitter_1.EventEmitter2])
], ServiceReportsService);
//# sourceMappingURL=service-reports.service.js.map