"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const redis_service_1 = require("../../redis/redis.service");
const settings_service_1 = require("../settings/settings.service");
const pdf_service_1 = require("../pdf/pdf.service");
const document_template_service_1 = require("../pdf/templates/document-template.service");
const reports_template_1 = require("./templates/reports.template");
const XLSX = __importStar(require("xlsx"));
const ExcelJS = __importStar(require("exceljs"));
let ReportsService = class ReportsService {
    prisma;
    redis;
    settingsService;
    pdfService;
    documentTemplateService;
    CACHE_PREFIX = 'reports:';
    constructor(prisma, redis, settingsService, pdfService, documentTemplateService) {
        this.prisma = prisma;
        this.redis = redis;
        this.settingsService = settingsService;
        this.pdfService = pdfService;
        this.documentTemplateService = documentTemplateService;
    }
    getServicesWhereClause(params, user) {
        const { search, status, categoryId, dateFrom, dateTo, millId, technicianId, millName, frameNo, refNo, } = params;
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
        if (categoryId) {
            where.service_category_id = categoryId;
        }
        if (millId) {
            where.mill_id = millId;
        }
        if (millName) {
            where.mill = {
                name: { contains: millName, mode: 'insensitive' },
            };
        }
        if (frameNo) {
            where.serial_or_frame_no = { contains: frameNo, mode: 'insensitive' };
        }
        if (refNo) {
            where.mill = {
                ...where.mill,
                ref_no: { contains: refNo, mode: 'insensitive' },
            };
        }
        if (technicianId) {
            if (where.technicians) {
                where.technicians.some.technician_id = technicianId;
            }
            else {
                where.technicians = { some: { technician_id: technicianId } };
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
        return where;
    }
    async getServices(params, user) {
        const cacheKey = `${this.CACHE_PREFIX}services:${JSON.stringify({ params, user })}`;
        const cached = await this.redis.getJson(cacheKey);
        if (cached)
            return cached;
        const where = this.getServicesWhereClause(params, user);
        const [reports, total] = await Promise.all([
            this.prisma.serviceReport.findMany({
                skip: params.skip,
                take: params.take,
                where,
                include: {
                    mill: { select: { id: true, name: true } },
                    serviceCategory: { select: { id: true, name: true } },
                    technicians: {
                        include: { technician: { select: { id: true, full_name: true } } },
                    },
                },
                orderBy: { visit_date: 'desc' },
            }),
            this.prisma.serviceReport.count({ where }),
        ]);
        const { status, ...whereWithoutStatus } = where;
        const [totalCount, pendingCount, inProgressCount, completedCount] = await Promise.all([
            this.prisma.serviceReport.count({ where: whereWithoutStatus }),
            this.prisma.serviceReport.count({
                where: { ...whereWithoutStatus, status: 'PENDING' },
            }),
            this.prisma.serviceReport.count({
                where: { ...whereWithoutStatus, status: 'IN_PROGRESS' },
            }),
            this.prisma.serviceReport.count({
                where: { ...whereWithoutStatus, status: 'COMPLETED' },
            }),
        ]);
        const result = {
            reports,
            total,
            metrics: {
                totalCount,
                pendingCount,
                inProgressCount,
                completedCount,
            },
        };
        await this.redis.setJson(cacheKey, result, 300);
        return result;
    }
    async exportServices(params, user, formatType) {
        const where = this.getServicesWhereClause(params, user);
        const reports = await this.prisma.serviceReport.findMany({
            where,
            include: {
                mill: { select: { id: true, name: true } },
                serviceCategory: { select: { id: true, name: true } },
                technicians: {
                    include: { technician: { select: { id: true, full_name: true } } },
                },
            },
            orderBy: { visit_date: 'desc' },
        });
        const headers = [
            'Report No',
            'Mill Name',
            'Place',
            'Visit Date',
            'Category',
            'Complaint',
            'Service',
            'Remark',
            'Technicians',
            'Status',
        ];
        const data = reports.map((r) => [
            r.report_number,
            r.mill?.name || '-',
            r.place || '-',
            r.visit_date ? r.visit_date.toISOString().slice(0, 10) : '-',
            r.serviceCategory?.name || '-',
            r.nature_of_complaint || '-',
            r.action_taken || '-',
            r.engineer_remarks || '-',
            r.technicians
                .map((t) => t.technician?.full_name)
                .filter(Boolean)
                .join(', ') || '-',
            r.status,
        ]);
        if (formatType === 'csv') {
            const buffer = this.generateCsv(headers, data);
            return {
                buffer,
                fileName: `service_reports_${Date.now()}.csv`,
                contentType: 'text/csv',
            };
        }
        if (formatType === 'excel') {
            const buffer = this.generateExcel('Service Reports', headers, data);
            return {
                buffer,
                fileName: `service_reports_${Date.now()}.xlsx`,
                contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            };
        }
        if (formatType === 'pdf') {
            const pending = reports.filter((r) => r.status === 'PENDING').length;
            const inProgress = reports.filter((r) => r.status === 'IN_PROGRESS').length;
            const completed = reports.filter((r) => r.status === 'COMPLETED').length;
            const pdfData = {
                title: 'Service Reports Log',
                filters: this.getFiltersSummary(params),
                metrics: [
                    {
                        label: 'Total Reports',
                        value: String(reports.length),
                        colorClass: 'text-primary',
                    },
                    {
                        label: 'Completed',
                        value: String(completed),
                        colorClass: 'text-success',
                    },
                    {
                        label: 'In Progress',
                        value: String(inProgress),
                        colorClass: 'text-info',
                    },
                    {
                        label: 'Pending',
                        value: String(pending),
                        colorClass: 'text-warning',
                    },
                ],
                headers,
                rows: reports.map((r) => [
                    `<span class="font-semibold">${this.documentTemplateService.escape(r.report_number)}</span>`,
                    this.documentTemplateService.escape(r.mill?.name),
                    this.documentTemplateService.escape(r.place),
                    this.documentTemplateService.date(r.visit_date),
                    `<span class="status-badge" style="background:#f3f4f6; color:#4b5563;">${this.documentTemplateService.escape(r.serviceCategory?.name)}</span>`,
                    this.documentTemplateService.escape(r.nature_of_complaint),
                    this.documentTemplateService.escape(r.action_taken),
                    this.documentTemplateService.escape(r.engineer_remarks),
                    this.documentTemplateService.escape(r.technicians.map((t) => t.technician?.full_name).join(', ')),
                    `<span class="status-badge status-${r.status.toLowerCase().replace(/_/g, '')}">${r.status}</span>`,
                ]),
                company: await this.getCompanyPdfSettings(),
            };
            pdfData.company.logoUrl = await this.pdfService.embedImageAsDataUrl(pdfData.company.logoUrl);
            const html = (0, reports_template_1.renderTabularReportTemplate)(pdfData, this.documentTemplateService);
            const buffer = await this.pdfService.renderHtmlToPdf(html, (0, reports_template_1.renderTabularReportPdfOptions)(pdfData.company, this.documentTemplateService));
            return {
                buffer,
                fileName: `service_reports_${Date.now()}.pdf`,
                contentType: 'application/pdf',
            };
        }
        throw new common_1.BadRequestException(`Format type ${formatType} is not supported`);
    }
    getInstallationsWhereClause(params, user) {
        const { search, status, dateFrom, dateTo, millId, technicianId, millName, frameNo, refNo } = params;
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
        if (millName) {
            where.mill = {
                name: { contains: millName, mode: 'insensitive' },
            };
        }
        if (frameNo) {
            where.serial_or_frame_no = { contains: frameNo, mode: 'insensitive' };
        }
        if (refNo) {
            where.mill = {
                ...where.mill,
                ref_no: { contains: refNo, mode: 'insensitive' },
            };
        }
        if (technicianId) {
            if (where.technicians) {
                where.technicians.some.technician_id = technicianId;
            }
            else {
                where.technicians = { some: { technician_id: technicianId } };
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
        return where;
    }
    async getInstallations(params, user) {
        const cacheKey = `${this.CACHE_PREFIX}installations:${JSON.stringify({ params, user })}`;
        const cached = await this.redis.getJson(cacheKey);
        if (cached)
            return cached;
        const where = this.getInstallationsWhereClause(params, user);
        const [reports, total] = await Promise.all([
            this.prisma.installationReport.findMany({
                skip: params.skip,
                take: params.take,
                where,
                include: {
                    mill: { select: { id: true, name: true } },
                    technicians: {
                        include: { technician: { select: { id: true, full_name: true } } },
                    },
                },
                orderBy: { visit_date: 'desc' },
            }),
            this.prisma.installationReport.count({ where }),
        ]);
        const { status, ...whereWithoutStatus } = where;
        const [totalCount, pendingCount, inProgressCount, completedCount] = await Promise.all([
            this.prisma.installationReport.count({ where: whereWithoutStatus }),
            this.prisma.installationReport.count({
                where: { ...whereWithoutStatus, status: 'PENDING' },
            }),
            this.prisma.installationReport.count({
                where: { ...whereWithoutStatus, status: 'IN_PROGRESS' },
            }),
            this.prisma.installationReport.count({
                where: { ...whereWithoutStatus, status: 'COMPLETED' },
            }),
        ]);
        const result = {
            reports,
            total,
            metrics: {
                totalCount,
                pendingCount,
                inProgressCount,
                completedCount,
            },
        };
        await this.redis.setJson(cacheKey, result, 300);
        return result;
    }
    async exportInstallations(params, user, formatType) {
        const where = this.getInstallationsWhereClause(params, user);
        const reports = await this.prisma.installationReport.findMany({
            where,
            include: {
                mill: { select: { id: true, name: true } },
                technicians: {
                    include: { technician: { select: { id: true, full_name: true } } },
                },
            },
            orderBy: { visit_date: 'desc' },
        });
        const headers = [
            'Report No',
            'Mill Name',
            'Place',
            'Visit Date',
            'Machine Model',
            'Serial/Frame No',
            'Technicians',
            'Status',
        ];
        const data = reports.map((r) => [
            r.report_number,
            r.mill?.name || '-',
            r.place || '-',
            r.visit_date ? r.visit_date.toISOString().slice(0, 10) : '-',
            r.machine_model || '-',
            r.serial_or_frame_no || '-',
            r.technicians
                .map((t) => t.technician?.full_name)
                .filter(Boolean)
                .join(', ') || '-',
            r.status,
        ]);
        if (formatType === 'csv') {
            const buffer = this.generateCsv(headers, data);
            return {
                buffer,
                fileName: `installation_reports_${Date.now()}.csv`,
                contentType: 'text/csv',
            };
        }
        if (formatType === 'excel') {
            const buffer = this.generateExcel('Installations', headers, data);
            return {
                buffer,
                fileName: `installation_reports_${Date.now()}.xlsx`,
                contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            };
        }
        if (formatType === 'pdf') {
            const pending = reports.filter((r) => r.status === 'PENDING').length;
            const inProgress = reports.filter((r) => r.status === 'IN_PROGRESS').length;
            const completed = reports.filter((r) => r.status === 'COMPLETED').length;
            const pdfData = {
                title: 'Installation Reports Log',
                filters: this.getFiltersSummary(params),
                metrics: [
                    {
                        label: 'Total Installations',
                        value: String(reports.length),
                        colorClass: 'text-primary',
                    },
                    {
                        label: 'Completed',
                        value: String(completed),
                        colorClass: 'text-success',
                    },
                    {
                        label: 'In Progress',
                        value: String(inProgress),
                        colorClass: 'text-info',
                    },
                    {
                        label: 'Pending',
                        value: String(pending),
                        colorClass: 'text-warning',
                    },
                ],
                headers,
                rows: reports.map((r) => [
                    `<span class="font-semibold">${this.documentTemplateService.escape(r.report_number)}</span>`,
                    this.documentTemplateService.escape(r.mill?.name),
                    this.documentTemplateService.escape(r.place),
                    this.documentTemplateService.date(r.visit_date),
                    this.documentTemplateService.escape(r.machine_model),
                    this.documentTemplateService.escape(r.serial_or_frame_no),
                    this.documentTemplateService.escape(r.technicians.map((t) => t.technician?.full_name).join(', ')),
                    `<span class="status-badge status-${r.status.toLowerCase().replace(/_/g, '')}">${r.status}</span>`,
                ]),
                company: await this.getCompanyPdfSettings(),
            };
            pdfData.company.logoUrl = await this.pdfService.embedImageAsDataUrl(pdfData.company.logoUrl);
            const html = (0, reports_template_1.renderTabularReportTemplate)(pdfData, this.documentTemplateService);
            const buffer = await this.pdfService.renderHtmlToPdf(html, (0, reports_template_1.renderTabularReportPdfOptions)(pdfData.company, this.documentTemplateService));
            return {
                buffer,
                fileName: `installation_reports_${Date.now()}.pdf`,
                contentType: 'application/pdf',
            };
        }
        throw new common_1.BadRequestException(`Format type ${formatType} is not supported`);
    }
    getExpensesWhereClause(params, user) {
        const { search, status, categoryId, dateFrom, dateTo, createdDateFrom, createdDateTo, expenseDateFrom, expenseDateTo, millId, technicianId, millName, frameNo, refNo, } = params;
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
                { expense_number: { contains: search, mode: 'insensitive' } },
                { place: { contains: search, mode: 'insensitive' } },
                { others: { contains: search, mode: 'insensitive' } },
                { mill: { name: { contains: search, mode: 'insensitive' } } },
                {
                    expenseCategory: { name: { contains: search, mode: 'insensitive' } },
                },
            ];
        }
        if (status) {
            where.status = status;
        }
        if (categoryId) {
            where.expense_category_id = categoryId;
        }
        if (millId) {
            where.mill_id = millId;
        }
        if (millName) {
            where.mill = {
                name: { contains: millName, mode: 'insensitive' },
            };
        }
        if (refNo) {
            where.mill = {
                ...where.mill,
                ref_no: { contains: refNo, mode: 'insensitive' },
            };
        }
        if (frameNo) {
            if (where.OR) {
                where.AND = [
                    { OR: where.OR },
                    {
                        OR: [
                            { serviceReport: { serial_or_frame_no: { contains: frameNo, mode: 'insensitive' } } },
                            { installationReport: { serial_or_frame_no: { contains: frameNo, mode: 'insensitive' } } },
                        ]
                    }
                ];
                delete where.OR;
            }
            else {
                where.OR = [
                    { serviceReport: { serial_or_frame_no: { contains: frameNo, mode: 'insensitive' } } },
                    { installationReport: { serial_or_frame_no: { contains: frameNo, mode: 'insensitive' } } },
                ];
            }
        }
        if (technicianId) {
            if (where.technicians) {
                where.technicians.some.technician_id = technicianId;
            }
            else {
                where.technicians = { some: { technician_id: technicianId } };
            }
        }
        const effExpenseFrom = expenseDateFrom || dateFrom;
        const effExpenseTo = expenseDateTo || dateTo;
        if (effExpenseFrom || effExpenseTo) {
            where.visit_date = {};
            if (effExpenseFrom) {
                const [fy, fm, fd] = effExpenseFrom.split('-').map(Number);
                const fromDate = new Date(fy, fm - 1, fd, 0, 0, 0, 0);
                where.visit_date.gte = fromDate;
            }
            if (effExpenseTo) {
                const [ty, tm, td] = effExpenseTo.split('-').map(Number);
                const toDate = new Date(ty, tm - 1, td, 23, 59, 59, 999);
                where.visit_date.lte = toDate;
            }
        }
        if (createdDateFrom || createdDateTo) {
            where.created_at = {};
            if (createdDateFrom) {
                const [cy, cm, cd] = createdDateFrom.split('-').map(Number);
                const cFromDate = new Date(cy, cm - 1, cd, 0, 0, 0, 0);
                where.created_at.gte = cFromDate;
            }
            if (createdDateTo) {
                const [cy, cm, cd] = createdDateTo.split('-').map(Number);
                const cToDate = new Date(cy, cm - 1, cd, 23, 59, 59, 999);
                where.created_at.lte = cToDate;
            }
        }
        return where;
    }
    async getExpenses(params, user) {
        const cacheKey = `${this.CACHE_PREFIX}expenses:${JSON.stringify({ params, user })}`;
        const cached = await this.redis.getJson(cacheKey);
        if (cached)
            return cached;
        const where = this.getExpensesWhereClause(params, user);
        const [reports, total] = await Promise.all([
            this.prisma.expense.findMany({
                skip: params.skip,
                take: params.take,
                where,
                include: {
                    mill: { select: { id: true, name: true } },
                    expenseCategory: { select: { id: true, name: true } },
                    technicians: {
                        include: { technician: { select: { id: true, full_name: true } } },
                    },
                },
                orderBy: { visit_date: 'desc' },
            }),
            this.prisma.expense.count({ where }),
        ]);
        const { status, ...whereWithoutStatus } = where;
        const expensesAggregated = await this.prisma.expense.findMany({
            where: whereWithoutStatus,
            select: {
                amount: true,
                admin_amount: true,
                status: true,
            },
        });
        let totalAmount = 0;
        let pendingCount = 0;
        let inProgressCount = 0;
        let completedCount = 0;
        for (const exp of expensesAggregated) {
            const adminAmt = parseFloat(exp.admin_amount ? String(exp.admin_amount) : '0');
            const amt = adminAmt > 0
                ? adminAmt
                : parseFloat(exp.amount ? String(exp.amount) : '0');
            totalAmount += amt;
            if (exp.status === 'PENDING')
                pendingCount++;
            else if (exp.status === 'IN_PROGRESS')
                inProgressCount++;
            else if (exp.status === 'COMPLETED')
                completedCount++;
        }
        const result = {
            reports,
            total,
            metrics: {
                totalCount: expensesAggregated.length,
                totalAmount,
                pendingCount,
                inProgressCount,
                completedCount,
            },
        };
        await this.redis.setJson(cacheKey, result, 300);
        return result;
    }
    async exportExpenses(params, user, formatType) {
        const where = this.getExpensesWhereClause(params, user);
        const reports = await this.prisma.expense.findMany({
            where,
            include: {
                mill: { select: { id: true, name: true } },
                expenseCategory: { select: { id: true, name: true } },
                technicians: {
                    include: { technician: { select: { id: true, full_name: true } } },
                },
                expense_items: {
                    include: {
                        expenseCategory: { select: { id: true, name: true } },
                    },
                },
            },
            orderBy: { visit_date: 'desc' },
        });
        const activeCategories = await this.prisma.expenseCategory.findMany({
            where: { deleted_at: null },
            orderBy: { name: 'asc' },
        });
        const usedCategoriesSet = new Set();
        reports.forEach((r) => {
            if (r.expenseCategory?.name) {
                usedCategoriesSet.add(r.expenseCategory.name);
            }
            if (r.expense_items) {
                r.expense_items.forEach((item) => {
                    if (item.expenseCategory?.name) {
                        usedCategoriesSet.add(item.expenseCategory.name);
                    }
                });
            }
        });
        const categoryNames = Array.from(new Set([
            ...activeCategories.map((c) => c.name),
            ...Array.from(usedCategoriesSet),
        ])).sort();
        let technicianName = '';
        const targetTechId = params.technicianId || (user.role === 'Service Engineer' ? user.userId : undefined);
        if (targetTechId) {
            const tech = await this.prisma.technician.findUnique({
                where: { id: targetTechId },
            });
            if (tech) {
                technicianName = tech.full_name.toUpperCase();
            }
        }
        const headers = technicianName
            ? [
                'Date',
                'Name',
                'place',
                ...categoryNames.map((name) => name.toUpperCase()),
                'Total',
            ]
            : [
                'Expense No',
                'Mill Name / Details',
                'Place',
                'Visit Date',
                ...categoryNames,
                'Total Amount (INR)',
                'Technicians',
                'Status',
            ];
        const data = reports.map((r) => {
            const categoryAmounts = {};
            categoryNames.forEach((cat) => {
                categoryAmounts[cat] = 0;
            });
            if (r.expense_items && r.expense_items.length > 0) {
                r.expense_items.forEach((item) => {
                    const catName = item.expenseCategory?.name;
                    if (catName) {
                        const itemAdminAmt = Number(item.admin_amount || 0);
                        const itemDisplayAmt = itemAdminAmt > 0 ? itemAdminAmt : Number(item.amount || 0);
                        categoryAmounts[catName] =
                            (categoryAmounts[catName] || 0) + itemDisplayAmt;
                    }
                });
            }
            else {
                const catName = r.expenseCategory?.name;
                if (catName) {
                    const adminAmt = Number(r.admin_amount || 0);
                    const displayAmt = adminAmt > 0 ? adminAmt : Number(r.amount || 0);
                    categoryAmounts[catName] = displayAmt;
                }
            }
            const totalDisplayAmt = Object.values(categoryAmounts).reduce((sum, val) => sum + val, 0);
            const categoryCols = categoryNames.map((cat) => Math.round(categoryAmounts[cat] || 0));
            if (technicianName) {
                return [
                    r.visit_date ? r.visit_date.toISOString().slice(0, 10) : '-',
                    r.mill?.name || r.others || '-',
                    r.place || '-',
                    ...categoryCols,
                    Math.round(totalDisplayAmt),
                ];
            }
            return [
                r.expense_number,
                r.mill?.name || r.others || '-',
                r.place || '-',
                r.visit_date ? r.visit_date.toISOString().slice(0, 10) : '-',
                ...categoryCols,
                Math.round(totalDisplayAmt),
                r.technicians
                    .map((t) => t.technician?.full_name)
                    .filter(Boolean)
                    .join(', ') || '-',
                r.status,
            ];
        });
        if (formatType === 'csv') {
            const fileName = technicianName
                ? `${technicianName}_expense_report_${Date.now()}.csv`
                : `expense_reports_${Date.now()}.csv`;
            const buffer = this.generateCsv(headers, data);
            return {
                buffer,
                fileName,
                contentType: 'text/csv',
            };
        }
        if (formatType === 'excel') {
            let headerBlock = undefined;
            let sheetName = 'Expenses';
            let fileName = `expense_reports_${Date.now()}.xlsx`;
            if (technicianName) {
                const company = await this.getCompanyPdfSettings();
                headerBlock = [
                    [],
                    [company.name, '', '', '', '', 'Mark Sorting System Travelling Expense'],
                    [company.addressLine1 || ''],
                    [company.addressLine2 || ''],
                    [company.region || ''],
                    [`Name:${technicianName}`],
                    [],
                ];
                sheetName = `${technicianName}_expense_report`;
                fileName = `${technicianName}_expense_report_${Date.now()}.xlsx`;
            }
            const buffer = this.generateExcel(sheetName, headers, data, headerBlock);
            return {
                buffer,
                fileName,
                contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            };
        }
        if (formatType === 'pdf') {
            let totalAmount = 0;
            let pending = 0;
            let inProgress = 0;
            let completed = 0;
            reports.forEach((r) => {
                const adminAmt = parseFloat(r.admin_amount ? String(r.admin_amount) : '0');
                const amt = adminAmt > 0
                    ? adminAmt
                    : parseFloat(r.amount ? String(r.amount) : '0');
                totalAmount += amt;
                if (r.status === 'PENDING')
                    pending++;
                else if (r.status === 'IN_PROGRESS')
                    inProgress++;
                else if (r.status === 'COMPLETED')
                    completed++;
            });
            const formattedTotalAmount = `₹${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
            const pdfData = {
                title: 'Expense Reports Log',
                filters: this.getFiltersSummary(params),
                metrics: [
                    {
                        label: 'Total Expenses',
                        value: String(reports.length),
                        colorClass: 'text-primary',
                    },
                    {
                        label: 'Total Amount',
                        value: formattedTotalAmount,
                        colorClass: 'text-success font-bold',
                    },
                    {
                        label: 'Completed',
                        value: String(completed),
                        colorClass: 'text-success',
                    },
                    {
                        label: 'Pending Approval',
                        value: String(pending + inProgress),
                        colorClass: 'text-warning',
                    },
                ],
                headers,
                rows: reports.map((r) => {
                    const categoryAmounts = {};
                    categoryNames.forEach((cat) => {
                        categoryAmounts[cat] = 0;
                    });
                    if (r.expense_items && r.expense_items.length > 0) {
                        r.expense_items.forEach((item) => {
                            const catName = item.expenseCategory?.name;
                            if (catName) {
                                const itemAdminAmt = Number(item.admin_amount || 0);
                                const itemDisplayAmt = itemAdminAmt > 0 ? itemAdminAmt : Number(item.amount || 0);
                                categoryAmounts[catName] =
                                    (categoryAmounts[catName] || 0) + itemDisplayAmt;
                            }
                        });
                    }
                    else {
                        const catName = r.expenseCategory?.name;
                        if (catName) {
                            const adminAmt = Number(r.admin_amount || 0);
                            const displayAmt = adminAmt > 0 ? adminAmt : Number(r.amount || 0);
                            categoryAmounts[catName] = displayAmt;
                        }
                    }
                    const totalDisplayAmt = Object.values(categoryAmounts).reduce((sum, val) => sum + val, 0);
                    const categoryColsHtml = categoryNames.map((cat) => `₹${categoryAmounts[cat].toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
                    return [
                        `<span class="font-semibold">${this.documentTemplateService.escape(r.expense_number)}</span>`,
                        this.documentTemplateService.escape(r.mill?.name || r.others),
                        this.documentTemplateService.escape(r.place),
                        this.documentTemplateService.date(r.visit_date),
                        ...categoryColsHtml,
                        `<span class="font-semibold">₹${totalDisplayAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>`,
                        this.documentTemplateService.escape(r.technicians.map((t) => t.technician?.full_name).join(', ')),
                        `<span class="status-badge status-${r.status.toLowerCase().replace(/_/g, '')}">${r.status}</span>`,
                    ];
                }),
                company: await this.getCompanyPdfSettings(),
            };
            pdfData.company.logoUrl = await this.pdfService.embedImageAsDataUrl(pdfData.company.logoUrl);
            const html = (0, reports_template_1.renderTabularReportTemplate)(pdfData, this.documentTemplateService);
            const landscapeHtml = html.replace('@page { size: A4; }', '@page { size: A4 landscape; }');
            const pdfOptions = (0, reports_template_1.renderTabularReportPdfOptions)(pdfData.company, this.documentTemplateService);
            pdfOptions.landscape = true;
            const buffer = await this.pdfService.renderHtmlToPdf(landscapeHtml, pdfOptions);
            return {
                buffer,
                fileName: `expense_reports_${Date.now()}.pdf`,
                contentType: 'application/pdf',
            };
        }
        throw new common_1.BadRequestException(`Format type ${formatType} is not supported`);
    }
    getMasterMillsWhereClause(params, user) {
        const { search, status, dateFrom, dateTo, millId, millName, frameNo, refNo } = params;
        const where = { deleted_at: null };
        if (search) {
            where.OR = [
                { ref_no: { contains: search, mode: 'insensitive' } },
                { frame_no: { contains: search, mode: 'insensitive' } },
                { mc_model: { contains: search, mode: 'insensitive' } },
                { invoice_no: { contains: search, mode: 'insensitive' } },
                { place: { contains: search, mode: 'insensitive' } },
                { mill: { name: { contains: search, mode: 'insensitive' } } },
            ];
        }
        if (status) {
            where.status = status;
        }
        if (millId) {
            where.mill_id = millId;
        }
        if (millName) {
            where.mill = {
                name: { contains: millName, mode: 'insensitive' },
            };
        }
        if (frameNo) {
            where.frame_no = { contains: frameNo, mode: 'insensitive' };
        }
        if (refNo) {
            where.ref_no = { contains: refNo, mode: 'insensitive' };
        }
        if (dateFrom || dateTo) {
            where.installation_date = {};
            if (dateFrom) {
                const [fy, fm, fd] = dateFrom.split('-').map(Number);
                const fromDate = new Date(fy, fm - 1, fd, 0, 0, 0, 0);
                where.installation_date.gte = fromDate;
            }
            if (dateTo) {
                const [ty, tm, td] = dateTo.split('-').map(Number);
                const toDate = new Date(ty, tm - 1, td, 23, 59, 59, 999);
                where.installation_date.lte = toDate;
            }
        }
        return where;
    }
    async getMasterMills(params, user) {
        const cacheKey = `${this.CACHE_PREFIX}master-mills:${JSON.stringify({ params, user })}`;
        const cached = await this.redis.getJson(cacheKey);
        if (cached)
            return cached;
        const where = this.getMasterMillsWhereClause(params, user);
        const [reports, total] = await Promise.all([
            this.prisma.masterMill.findMany({
                skip: params.skip,
                take: params.take,
                where,
                include: {
                    mill: { select: { id: true, name: true } },
                },
                orderBy: { installation_date: 'desc' },
            }),
            this.prisma.masterMill.count({ where }),
        ]);
        const { status, ...whereWithoutStatus } = where;
        const now = new Date();
        const [underWarrantyCount, underAmcCount, nonWarrantyCount, totalCount] = await Promise.all([
            this.prisma.masterMill.count({
                where: {
                    ...whereWithoutStatus,
                    all_warranty: 'Under Warranty',
                },
            }),
            this.prisma.masterMill.count({
                where: {
                    ...whereWithoutStatus,
                    all_warranty: 'Under AMC',
                },
            }),
            this.prisma.masterMill.count({
                where: { ...whereWithoutStatus, all_warranty: 'Non Warranty' },
            }),
            this.prisma.masterMill.count({
                where: whereWithoutStatus,
            }),
        ]);
        const result = {
            reports,
            total,
            metrics: {
                totalCount,
                underWarrantyCount,
                underAmcCount,
                nonWarrantyCount,
            },
        };
        await this.redis.setJson(cacheKey, result, 300);
        return result;
    }
    async exportMasterMills(params, user, formatType) {
        const where = this.getMasterMillsWhereClause(params, user);
        const reports = await this.prisma.masterMill.findMany({
            where,
            include: {
                mill: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                        phone: true,
                        customer: {
                            select: { id: true, name: true },
                        },
                    },
                },
            },
            orderBy: { installation_date: 'desc' },
        });
        const formatDate = (date) => {
            if (!date)
                return '';
            const d = new Date(date);
            if (isNaN(d.getTime()))
                return '';
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            return `${day}/${month}/${year}`;
        };
        const headers = [
            'Invoice No',
            'Invoice Date',
            'Ref No',
            'Mill Name',
            'Customer Name',
            'Place',
            'State',
            'Phone No',
            'Address',
            'Frame No',
            'MC Model',
            'MFG Date',
            'Installation Date',
            'Warranty Start Date',
            'Warranty Period (Months)',
            'AMC Starting Date',
            'AMC Closing Date',
            'AMC Period (Months)',
            'AMC Amount',
            'AMC Particulars',
        ];
        const dataRows = reports.map((r) => [
            r.invoice_no || '',
            formatDate(r.invoice_date),
            r.ref_no || '',
            r.mill?.name || '',
            r.mill?.customer?.name || '',
            r.place || '',
            r.state || '',
            r.phone_no || r.mill?.phone || '',
            r.address || r.mill?.address || '',
            r.frame_no || '',
            r.mc_model || '',
            formatDate(r.mfg_date),
            formatDate(r.installation_date),
            formatDate(r.warranty_start_date),
            r.warranty_months !== null && r.warranty_months !== undefined
                ? r.warranty_months
                : r.warranty_years
                    ? r.warranty_years * 12
                    : 0,
            formatDate(r.amc_starting_date),
            formatDate(r.amc_closing_date),
            r.amc_period !== null && r.amc_period !== undefined ? r.amc_period : '',
            r.amc_amount !== null && r.amc_amount !== undefined ? Number(r.amc_amount) : 0,
            r.amc_particular || '',
        ]);
        if (formatType === 'csv') {
            const buffer = this.generateCsv(headers, dataRows);
            return {
                buffer,
                fileName: `master_mills_report_${Date.now()}.csv`,
                contentType: 'text/csv',
            };
        }
        if (formatType === 'excel') {
            const formatSheetDate = (dStr) => {
                if (!dStr)
                    return '';
                const parts = dStr.trim().split(/[-/]/);
                if (parts.length === 3) {
                    if (parts[0].length === 4) {
                        return `${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[0]}`;
                    }
                    return `${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[2]}`;
                }
                return dStr;
            };
            let sheetName = 'Masters';
            if (params.dateFrom && params.dateTo) {
                const fromStr = formatSheetDate(params.dateFrom);
                const toStr = formatSheetDate(params.dateTo);
                sheetName = `Masters ${fromStr} - ${toStr}`;
                if (sheetName.length > 31) {
                    const shortFrom = `${fromStr.slice(0, 6)}${fromStr.slice(-2)}`;
                    const shortTo = `${toStr.slice(0, 6)}${toStr.slice(-2)}`;
                    sheetName = `Masters ${shortFrom} to ${shortTo}`;
                }
            }
            else if (params.dateFrom) {
                sheetName = `Masters From ${formatSheetDate(params.dateFrom)}`;
            }
            else if (params.dateTo) {
                sheetName = `Masters To ${formatSheetDate(params.dateTo)}`;
            }
            sheetName = sheetName.replace(/[\\/?*:[\]]/g, '-').slice(0, 31);
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet(sheetName);
            worksheet.columns = headers.map((header) => ({
                header,
                key: header,
                width: Math.max(header.length + 4, 15),
            }));
            const headerRow = worksheet.getRow(1);
            headerRow.eachCell((cell) => {
                cell.font = { bold: true };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFD3D3D3' },
                };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
            });
            dataRows.forEach((row) => {
                worksheet.addRow(row);
            });
            const arrayBuffer = await workbook.xlsx.writeBuffer();
            const buffer = Buffer.from(arrayBuffer);
            return {
                buffer,
                fileName: `master_mills_report_${Date.now()}.xlsx`,
                contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            };
        }
        if (formatType === 'pdf') {
            const now = new Date();
            const underWarranty = reports.filter((r) => r.all_warranty === 'Under Warranty').length;
            const underAmc = reports.filter((r) => r.all_warranty === 'Under AMC').length;
            const nonWarranty = reports.filter((r) => r.all_warranty === 'Non Warranty').length;
            const pdfData = {
                title: 'Master Mills Report Log',
                filters: this.getFiltersSummary(params),
                metrics: [
                    {
                        label: 'Total Records',
                        value: String(reports.length),
                        colorClass: 'text-primary',
                    },
                    {
                        label: 'Under Warranty',
                        value: String(underWarranty),
                        colorClass: 'text-success',
                    },
                    {
                        label: 'Under AMC',
                        value: String(underAmc),
                        colorClass: 'text-info',
                    },
                    {
                        label: 'Non Warranty',
                        value: String(nonWarranty),
                        colorClass: 'text-warning',
                    },
                ],
                headers,
                rows: reports.map((r) => [
                    `<span class="font-semibold">${this.documentTemplateService.escape(r.ref_no || '-')} / ${this.documentTemplateService.escape(r.frame_no || '-')}</span>`,
                    this.documentTemplateService.escape(r.mill?.name),
                    this.documentTemplateService.escape(r.place),
                    this.documentTemplateService.escape(r.mc_model),
                    this.documentTemplateService.date(r.installation_date),
                    `<span class="status-badge" style="background:#f3f4f6; color:#4b5563;">${this.documentTemplateService.escape(r.all_warranty || 'Non Warranty')}</span>`,
                    r.amc_period ? `${r.amc_period} Months` : '-',
                    `<span class="status-badge status-${r.status.toLowerCase().replace(/_/g, '')}">${r.status}</span>`,
                ]),
                company: await this.getCompanyPdfSettings(),
            };
            pdfData.company.logoUrl = await this.pdfService.embedImageAsDataUrl(pdfData.company.logoUrl);
            const html = (0, reports_template_1.renderTabularReportTemplate)(pdfData, this.documentTemplateService);
            const buffer = await this.pdfService.renderHtmlToPdf(html, (0, reports_template_1.renderTabularReportPdfOptions)(pdfData.company, this.documentTemplateService));
            return {
                buffer,
                fileName: `master_mills_report_${Date.now()}.pdf`,
                contentType: 'application/pdf',
            };
        }
        throw new common_1.BadRequestException(`Format type ${formatType} is not supported`);
    }
    generateCsv(headers, rows) {
        const escapeCsvCell = (val) => {
            const str = String(val);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };
        const headerLine = headers.map(escapeCsvCell).join(',');
        const bodyLines = rows.map((r) => r.map(escapeCsvCell).join(','));
        const csvContent = [headerLine, ...bodyLines].join('\n');
        return Buffer.from(csvContent, 'utf-8');
    }
    generateExcel(sheetName, headers, rows, headerBlock) {
        const workbook = XLSX.utils.book_new();
        const sheetData = headerBlock ? [...headerBlock, headers, ...rows] : [headers, ...rows];
        const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
        const colWidths = headers.map((h, i) => {
            const maxLength = Math.max(h.length, ...rows.map((row) => (row[i] ? String(row[i]).length : 0)));
            return { wch: Math.min(maxLength + 3, 50) };
        });
        worksheet['!cols'] = colWidths;
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        const excelBuffer = XLSX.write(workbook, {
            type: 'buffer',
            bookType: 'xlsx',
        });
        return excelBuffer;
    }
    getFiltersSummary(params) {
        const list = [];
        if (params.search) {
            list.push({ label: 'Search Query', value: params.search });
        }
        if (params.status) {
            list.push({ label: 'Status', value: params.status });
        }
        if (params.millId) {
            list.push({ label: 'Mill ID', value: params.millId });
        }
        if (params.technicianId) {
            list.push({ label: 'Technician ID', value: params.technicianId });
        }
        if (params.dateFrom) {
            list.push({ label: 'From Date', value: params.dateFrom });
        }
        if (params.dateTo) {
            list.push({ label: 'To Date', value: params.dateTo });
        }
        return list;
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
    getStoresWhereClause(params, user) {
        const { search, serviceEngineerId, customerId, materialId, warrantyStatus, returnStatus, inflowStatus, dateFrom, dateTo, } = params;
        const where = { deleted_at: null };
        if (user && user.role === 'Service Engineer') {
            where.service_engineer_id = user.userId;
        }
        else if (serviceEngineerId) {
            where.service_engineer_id = serviceEngineerId;
        }
        if (customerId) {
            where.customer_id = customerId;
        }
        if (warrantyStatus) {
            where.warranty_status = warrantyStatus;
        }
        if (returnStatus) {
            where.return_status = returnStatus;
        }
        if (inflowStatus) {
            where.inflow_status = inflowStatus;
        }
        if (materialId) {
            where.materials = {
                some: {
                    material_id: materialId,
                },
            };
        }
        if (dateFrom || dateTo) {
            where.created_at = {};
            if (dateFrom) {
                where.created_at.gte = new Date(dateFrom);
            }
            if (dateTo) {
                const toDate = new Date(dateTo);
                toDate.setUTCHours(23, 59, 59, 999);
                where.created_at.lte = toDate;
            }
        }
        if (search) {
            where.OR = [
                { frame_number: { contains: search, mode: 'insensitive' } },
                { barcode: { contains: search, mode: 'insensitive' } },
                {
                    service_engineer: {
                        full_name: { contains: search, mode: 'insensitive' },
                    },
                },
                {
                    customer: {
                        name: { contains: search, mode: 'insensitive' },
                    },
                },
            ];
        }
        return where;
    }
    async enrichStoresWithMillAndRefNo(stores) {
        const frameNumbers = stores
            .map((s) => s.frame_number)
            .filter((fn) => Boolean(fn));
        if (frameNumbers.length === 0)
            return stores;
        const masterMills = await this.prisma.masterMill.findMany({
            where: {
                frame_no: { in: frameNumbers },
                deleted_at: null,
            },
            select: {
                frame_no: true,
                ref_no: true,
                mill: {
                    select: {
                        id: true,
                        name: true,
                        ref_no: true,
                        customer: { select: { id: true, name: true } },
                    },
                },
            },
        });
        const customerByFrame = new Map();
        const millByFrame = new Map();
        const refNoByFrame = new Map();
        for (const mm of masterMills) {
            if (mm.frame_no) {
                const ref = mm.ref_no || mm.mill?.ref_no;
                if (ref) {
                    refNoByFrame.set(mm.frame_no, ref);
                }
                if (mm.mill) {
                    millByFrame.set(mm.frame_no, { id: mm.mill.id, name: mm.mill.name });
                    if (mm.mill.customer) {
                        customerByFrame.set(mm.frame_no, mm.mill.customer);
                    }
                    else if (mm.mill.name) {
                        customerByFrame.set(mm.frame_no, { id: mm.mill.id, name: mm.mill.name });
                    }
                }
            }
        }
        return stores.map((s) => {
            const resolvedCustomer = s.customer ||
                (s.frame_number && customerByFrame.has(s.frame_number)
                    ? customerByFrame.get(s.frame_number)
                    : null);
            const resolvedMill = s.mill ||
                (s.frame_number && millByFrame.has(s.frame_number)
                    ? millByFrame.get(s.frame_number)
                    : null);
            const resolvedRefNo = s.ref_no ||
                (s.frame_number && refNoByFrame.has(s.frame_number)
                    ? refNoByFrame.get(s.frame_number)
                    : null);
            return {
                ...s,
                customer: resolvedCustomer,
                mill: resolvedMill,
                ref_no: resolvedRefNo,
            };
        });
    }
    async getStores(params, user) {
        const cacheKey = `${this.CACHE_PREFIX}stores:${JSON.stringify(params)}:${JSON.stringify(user)}`;
        const cached = await this.redis.getJson(cacheKey);
        if (cached)
            return cached;
        const where = this.getStoresWhereClause(params, user);
        const [total, stores, returnedCount, pendingCount, notReturnedCount, completedCount] = await Promise.all([
            this.prisma.store.count({ where }),
            this.prisma.store.findMany({
                where,
                include: {
                    service_engineer: { select: { id: true, full_name: true } },
                    customer: { select: { id: true, name: true } },
                    materials: {
                        include: {
                            material: { select: { id: true, name: true } },
                        },
                    },
                },
                orderBy: { created_at: 'desc' },
                skip: params.skip || 0,
                take: params.take || 10,
            }),
            this.prisma.store.count({ where: { ...where, return_status: 'Returned' } }),
            this.prisma.store.count({ where: { ...where, return_status: 'Pending' } }),
            this.prisma.store.count({ where: { ...where, return_status: 'Not Returned' } }),
            this.prisma.store.count({ where: { ...where, return_status: 'Completed' } }),
        ]);
        const enrichedStores = await this.enrichStoresWithMillAndRefNo(stores);
        const result = {
            total,
            stores: enrichedStores,
            metrics: {
                totalCount: total,
                returnedCount,
                pendingCount,
                notReturnedCount,
                completedCount,
            },
        };
        await this.redis.setJson(cacheKey, result, 300);
        return result;
    }
    cleanBarcodeString(str) {
        let clean = str;
        clean = clean.replace(/\(.*?\)/g, '');
        clean = clean.replace(/\[.*?\]/g, '');
        clean = clean.replace(/(?:,\s*)?(?:RETURNED|NOT_RETURNED|ENG_ACK:[^,;)]+|ADM_ACK:[^,;)]+|RET:[^,;)]+|USED).*/gi, '');
        clean = clean.replace(/[()[\];,:]+/g, ' ');
        return clean.trim();
    }
    splitSerialsString(str) {
        const result = [];
        let current = '';
        let parenDepth = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str[i];
            if (char === '(') {
                parenDepth++;
                current += char;
            }
            else if (char === ')') {
                if (parenDepth > 0)
                    parenDepth--;
                current += char;
            }
            else if (char === ',' && parenDepth === 0) {
                if (current.trim())
                    result.push(current.trim());
                current = '';
            }
            else {
                current += char;
            }
        }
        if (current.trim()) {
            result.push(current.trim());
        }
        return result.filter((s) => {
            const t = s.trim();
            const isOrphan = /^(RETURNED|NOT_RETURNED|ENG_ACK:|ADM_ACK:)/i.test(t);
            return !isOrphan && t.length > 0;
        });
    }
    extractCleanRemarks(remarks) {
        if (!remarks)
            return '-';
        let text = remarks;
        const serialNosIdx = text.indexOf('Serial Nos:');
        if (serialNosIdx !== -1) {
            text = text.substring(0, serialNosIdx);
        }
        text = text.replace(/[\(\)\|\s]+$/, '').trim();
        return text || '-';
    }
    parseFullSerialMapFromRemarks(remarks) {
        if (!remarks)
            return {};
        const map = {};
        const serialNosIdx = remarks.indexOf('Serial Nos:');
        if (serialNosIdx === -1)
            return {};
        let serialStr = remarks.substring(serialNosIdx + 'Serial Nos:'.length);
        const stIdx = serialStr.indexOf('Service Type:');
        if (stIdx !== -1) {
            serialStr = serialStr.substring(0, stIdx);
        }
        serialStr = serialStr.replace(/[\)\|\s]+$/, '').trim();
        const parts = serialStr.split('|');
        parts.forEach((part) => {
            const colIdx = part.indexOf(':');
            if (colIdx !== -1) {
                const matName = part.substring(0, colIdx).trim();
                const serialsStr = part.substring(colIdx + 1).trim();
                const bracketMatch = serialsStr.match(/\[(.*?)\]/);
                if (bracketMatch && bracketMatch[1]) {
                    const rawSerials = this.splitSerialsString(bracketMatch[1]);
                    const serials = rawSerials
                        .map((s) => s.trim())
                        .filter(Boolean)
                        .map((s) => {
                        const used = /\(USED/i.test(s) || /USED/i.test(s);
                        const isNotReturned = /NOT_RETURNED|RET:Not Returned|Not Returned/i.test(s);
                        const engAckMatch = s.match(/ENG_ACK:(Acknowledged|Pending)/i);
                        const admAckMatch = s.match(/ADM_ACK:(Acknowledged|Pending)/i);
                        const barcode = this.cleanBarcodeString(s);
                        return {
                            barcode,
                            used,
                            return_status: used
                                ? isNotReturned
                                    ? 'Not Returned'
                                    : 'Returned'
                                : undefined,
                            engineer_ack: used
                                ? engAckMatch
                                    ? engAckMatch[1]
                                    : 'Acknowledged'
                                : undefined,
                            admin_ack: used
                                ? admAckMatch
                                    ? admAckMatch[1]
                                    : 'Pending'
                                : undefined,
                        };
                    })
                        .filter((s) => s.barcode);
                    map[matName] = serials;
                }
            }
        });
        return map;
    }
    async exportStores(params, user, formatType) {
        const where = this.getStoresWhereClause(params, user);
        const reports = await this.prisma.store.findMany({
            where,
            include: {
                service_engineer: { select: { id: true, full_name: true } },
                customer: { select: { id: true, name: true } },
                materials: {
                    include: {
                        material: { select: { id: true, name: true } },
                    },
                },
            },
            orderBy: { created_at: 'desc' },
        });
        const enrichedReports = await this.enrichStoresWithMillAndRefNo(reports);
        const headers = [
            'Ref No',
            'Mill Name',
            'Customer',
            'Frame Number',
            'Service Engineer',
            'Material Name',
            'Quantity',
            'Stock Type',
            'Barcode / Serial No',
            'Material Status',
            'Unit Return Status',
            'Engineer Acknowledge Status',
            'Admin Acknowledge Status',
            'Warranty Status',
            'Overall Return Status',
            'Courier / Provider',
            'Tracking / Invoice No',
            'Remarks',
            'Created At',
        ];
        const data = [];
        for (const r of enrichedReports) {
            const cleanRemarks = this.extractCleanRemarks(r.remarks);
            const serialMap = this.parseFullSerialMapFromRemarks(r.remarks);
            const createdAt = r.created_at
                ? new Date(r.created_at).toLocaleDateString('en-GB')
                : '-';
            const refNo = r.ref_no || '-';
            const millName = r.mill?.name || '-';
            const customer = r.customer?.name || r.mill?.name || '-';
            const frameNo = r.frame_number || '-';
            const engineer = r.service_engineer?.full_name || '-';
            const warranty = r.warranty_status || '-';
            const overallReturn = r.return_status || '-';
            const provider = r.provider_name || '-';
            const invoiceNo = r.invoice_number || '-';
            if (!r.materials || r.materials.length === 0) {
                data.push([
                    refNo,
                    millName,
                    customer,
                    frameNo,
                    engineer,
                    '-',
                    String(r.quantity || 0),
                    r.stock_type || 'Inflow',
                    r.barcode || '-',
                    '-',
                    overallReturn,
                    '-',
                    '-',
                    warranty,
                    overallReturn,
                    provider,
                    invoiceNo,
                    cleanRemarks,
                    createdAt,
                ]);
                continue;
            }
            for (const m of r.materials) {
                const matName = m.material?.name || '-';
                const stockType = m.stock_type || r.stock_type || 'Inflow';
                const units = serialMap[matName] || [];
                if (units.length > 0) {
                    for (const unit of units) {
                        const matStatus = unit.used ? 'Used Material' : 'Unused Material';
                        const unitRetStatus = unit.return_status || (unit.used ? 'Returned' : overallReturn);
                        const engAck = unit.engineer_ack || (unit.used ? 'Acknowledged' : '-');
                        const admAck = unit.admin_ack || (unit.used ? 'Pending' : '-');
                        data.push([
                            refNo,
                            millName,
                            customer,
                            frameNo,
                            engineer,
                            matName,
                            '1',
                            stockType,
                            unit.barcode || '-',
                            matStatus,
                            unitRetStatus,
                            engAck,
                            admAck,
                            warranty,
                            overallReturn,
                            provider,
                            invoiceNo,
                            cleanRemarks,
                            createdAt,
                        ]);
                    }
                }
                else {
                    data.push([
                        refNo,
                        millName,
                        customer,
                        frameNo,
                        engineer,
                        matName,
                        String(m.quantity || 1),
                        stockType,
                        r.barcode || '-',
                        '-',
                        overallReturn,
                        '-',
                        '-',
                        warranty,
                        overallReturn,
                        provider,
                        invoiceNo,
                        cleanRemarks,
                        createdAt,
                    ]);
                }
            }
        }
        if (formatType === 'csv') {
            const buffer = this.generateCsv(headers, data);
            return {
                buffer,
                fileName: `stores_report_${Date.now()}.csv`,
                contentType: 'text/csv',
            };
        }
        if (formatType === 'excel') {
            const formatSheetDate = (dStr) => {
                if (!dStr)
                    return '';
                const parts = dStr.trim().split(/[-/]/);
                if (parts.length === 3) {
                    if (parts[0].length === 4) {
                        return `${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[0]}`;
                    }
                    return `${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[2]}`;
                }
                return dStr;
            };
            let sheetName = 'Stores';
            if (params.dateFrom && params.dateTo) {
                const fromStr = formatSheetDate(params.dateFrom);
                const toStr = formatSheetDate(params.dateTo);
                sheetName = `Stores ${fromStr} - ${toStr}`;
                if (sheetName.length > 31) {
                    const shortFrom = `${fromStr.slice(0, 6)}${fromStr.slice(-2)}`;
                    const shortTo = `${toStr.slice(0, 6)}${toStr.slice(-2)}`;
                    sheetName = `Stores ${shortFrom} to ${shortTo}`;
                }
            }
            else if (params.dateFrom) {
                sheetName = `Stores From ${formatSheetDate(params.dateFrom)}`;
            }
            else if (params.dateTo) {
                sheetName = `Stores To ${formatSheetDate(params.dateTo)}`;
            }
            sheetName = sheetName.replace(/[\\/?*:[\]]/g, '-').slice(0, 31);
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet(sheetName);
            worksheet.columns = headers.map((header) => ({
                header,
                key: header,
                width: Math.max(header.length + 4, 16),
            }));
            const headerRow = worksheet.getRow(1);
            headerRow.eachCell((cell) => {
                cell.font = { bold: true };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFD3D3D3' },
                };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
                cell.alignment = { vertical: 'middle', horizontal: 'left' };
            });
            for (const rowData of data) {
                const row = worksheet.addRow(rowData);
                row.eachCell((cell) => {
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' },
                    };
                    cell.alignment = { vertical: 'middle', horizontal: 'left' };
                });
            }
            const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
            return {
                buffer,
                fileName: `stores_report_${Date.now()}.xlsx`,
                contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            };
        }
        if (formatType === 'pdf') {
            const now = new Date();
            const returnedCount = reports.filter((r) => r.return_status === 'Returned').length;
            const pendingCount = reports.filter((r) => r.return_status === 'Pending').length;
            const notReturnedCount = reports.filter((r) => r.return_status === 'Not Returned').length;
            const completedCount = reports.filter((r) => r.return_status === 'Completed').length;
            const pdfData = {
                title: 'Store Inventory Report Log',
                filters: this.getFiltersSummary(params),
                metrics: [
                    {
                        label: 'Total Records',
                        value: String(reports.length),
                        colorClass: 'text-primary',
                    },
                    {
                        label: 'Returned',
                        value: String(returnedCount),
                        colorClass: 'text-emerald-600',
                    },
                    {
                        label: 'Pending',
                        value: String(pendingCount),
                        colorClass: 'text-amber-600',
                    },
                    {
                        label: 'Not Returned',
                        value: String(notReturnedCount),
                        colorClass: 'text-rose-600',
                    },
                    {
                        label: 'Completed',
                        value: String(completedCount),
                        colorClass: 'text-teal-600',
                    },
                ],
                headers,
                rows: data,
                company: await this.getCompanyPdfSettings(),
                generatedAt: now.toLocaleString(),
            };
            pdfData.company.logoUrl = await this.pdfService.embedImageAsDataUrl(pdfData.company.logoUrl);
            const html = (0, reports_template_1.renderTabularReportTemplate)(pdfData, this.documentTemplateService);
            const landscapeHtml = html.replace('@page { size: A4; }', '@page { size: A4 landscape; }');
            const pdfOptions = (0, reports_template_1.renderTabularReportPdfOptions)(pdfData.company, this.documentTemplateService);
            pdfOptions.landscape = true;
            const buffer = await this.pdfService.renderHtmlToPdf(landscapeHtml, pdfOptions);
            return {
                buffer,
                fileName: `stores_report_${Date.now()}.pdf`,
                contentType: 'application/pdf',
            };
        }
        return null;
    }
    getMillsWhereClause(params, user) {
        const { search, status, dateFrom, dateTo, customerId, place, city, refNo } = params;
        const where = { deleted_at: null };
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { ref_no: { contains: search, mode: 'insensitive' } },
                { city: { contains: search, mode: 'insensitive' } },
                { place: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { customer: { name: { contains: search, mode: 'insensitive' } } },
            ];
        }
        if (status) {
            where.status = status;
        }
        if (customerId) {
            where.customer_id = customerId;
        }
        if (refNo) {
            where.ref_no = { contains: refNo, mode: 'insensitive' };
        }
        if (place) {
            where.place = { contains: place, mode: 'insensitive' };
        }
        if (city) {
            where.city = { contains: city, mode: 'insensitive' };
        }
        if (dateFrom || dateTo) {
            where.created_at = {};
            if (dateFrom) {
                const [fy, fm, fd] = dateFrom.split('-').map(Number);
                const fromDate = new Date(fy, fm - 1, fd, 0, 0, 0, 0);
                where.created_at.gte = fromDate;
            }
            if (dateTo) {
                const [ty, tm, td] = dateTo.split('-').map(Number);
                const toDate = new Date(ty, tm - 1, td, 23, 59, 59, 999);
                where.created_at.lte = toDate;
            }
        }
        return where;
    }
    async getMills(params, user) {
        const cacheKey = `${this.CACHE_PREFIX}mills:${JSON.stringify(params)}:${JSON.stringify(user)}`;
        const cached = await this.redis.getJson(cacheKey);
        if (cached)
            return cached;
        const where = this.getMillsWhereClause(params, user);
        const [total, mills, activeCount, inactiveCount, totalMachines] = await Promise.all([
            this.prisma.mill.count({ where }),
            this.prisma.mill.findMany({
                where,
                include: {
                    customer: { select: { id: true, name: true } },
                    masterMills: {
                        where: { deleted_at: null },
                        select: {
                            ref_no: true,
                            place: true,
                            state: true,
                        },
                        orderBy: { created_at: 'desc' },
                    },
                    _count: {
                        select: {
                            masterMills: { where: { deleted_at: null } },
                            serviceReports: { where: { deleted_at: null } },
                            installationReports: { where: { deleted_at: null } },
                        },
                    },
                },
                orderBy: { created_at: 'desc' },
                skip: params.skip || 0,
                take: params.take || 10,
            }),
            this.prisma.mill.count({ where: { ...where, status: 'ACTIVE' } }),
            this.prisma.mill.count({ where: { ...where, status: 'INACTIVE' } }),
            this.prisma.masterMill.count({
                where: {
                    deleted_at: null,
                    mill: where,
                },
            }),
        ]);
        const mappedMills = mills.map((m) => {
            const firstMM = m.masterMills?.[0];
            return {
                ...m,
                ref_no: m.ref_no || firstMM?.ref_no || null,
                customer: m.customer || (m.name ? { id: m.id, name: m.name } : null),
                place: m.place || firstMM?.place || null,
                city: m.city || m.place || firstMM?.place || null,
            };
        });
        const result = {
            total,
            mills: mappedMills,
            metrics: {
                totalCount: total,
                activeCount,
                inactiveCount,
                totalMachines,
            },
        };
        await this.redis.setJson(cacheKey, result, 300);
        return result;
    }
    async exportMills(params, user, formatType) {
        const where = this.getMillsWhereClause(params, user);
        const reports = await this.prisma.mill.findMany({
            where,
            include: {
                customer: { select: { id: true, name: true } },
                masterMills: {
                    where: { deleted_at: null },
                    select: {
                        ref_no: true,
                        place: true,
                        state: true,
                    },
                    orderBy: { created_at: 'desc' },
                },
                _count: {
                    select: {
                        masterMills: { where: { deleted_at: null } },
                        serviceReports: { where: { deleted_at: null } },
                        installationReports: { where: { deleted_at: null } },
                    },
                },
            },
            orderBy: { created_at: 'desc' },
        });
        const headers = [
            'Ref No',
            'Mill Name',
            'Customer Name',
            'City',
            'Place',
            'Primary Phone',
            'Secondary Phone',
            'Email',
            'Address',
            'Machines Count',
            'Services Count',
            'Installations Count',
            'Status',
            'Created At',
        ];
        const data = reports.map((m) => {
            const firstMM = m.masterMills?.[0];
            const refNo = m.ref_no || firstMM?.ref_no || '-';
            const customerName = m.customer?.name || m.name || '-';
            const city = m.city || m.place || firstMM?.place || '-';
            const place = m.place || firstMM?.place || m.city || '-';
            return [
                refNo,
                m.name,
                customerName,
                city,
                place,
                m.phone || '-',
                m.phone_2 || '-',
                m.email || '-',
                m.address || '-',
                String(m._count?.masterMills ?? 0),
                String(m._count?.serviceReports ?? 0),
                String(m._count?.installationReports ?? 0),
                m.status,
                m.created_at ? m.created_at.toISOString().slice(0, 10) : '-',
            ];
        });
        if (formatType === 'csv') {
            const buffer = this.generateCsv(headers, data);
            return {
                buffer,
                fileName: `mills_report_${Date.now()}.csv`,
                contentType: 'text/csv',
            };
        }
        if (formatType === 'excel') {
            const buffer = this.generateExcel('Mills', headers, data);
            return {
                buffer,
                fileName: `mills_report_${Date.now()}.xlsx`,
                contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            };
        }
        if (formatType === 'pdf') {
            const now = new Date();
            const activeCount = reports.filter((m) => m.status === 'ACTIVE').length;
            const inactiveCount = reports.filter((m) => m.status === 'INACTIVE').length;
            const pdfData = {
                title: 'Mills Directory Report',
                filters: this.getFiltersSummary(params),
                metrics: [
                    {
                        label: 'Total Mills',
                        value: String(reports.length),
                        colorClass: 'text-primary',
                    },
                    {
                        label: 'Active Mills',
                        value: String(activeCount),
                        colorClass: 'text-success',
                    },
                    {
                        label: 'Inactive Mills',
                        value: String(inactiveCount),
                        colorClass: 'text-warning',
                    },
                ],
                headers,
                rows: data,
                company: await this.getCompanyPdfSettings(),
                generatedAt: now.toLocaleString(),
            };
            pdfData.company.logoUrl = await this.pdfService.embedImageAsDataUrl(pdfData.company.logoUrl);
            const html = (0, reports_template_1.renderTabularReportTemplate)(pdfData, this.documentTemplateService);
            const landscapeHtml = html.replace('@page { size: A4; }', '@page { size: A4 landscape; }');
            const pdfOptions = (0, reports_template_1.renderTabularReportPdfOptions)(pdfData.company, this.documentTemplateService);
            pdfOptions.landscape = true;
            const buffer = await this.pdfService.renderHtmlToPdf(landscapeHtml, pdfOptions);
            return {
                buffer,
                fileName: `mills_report_${Date.now()}.pdf`,
                contentType: 'application/pdf',
            };
        }
        return null;
    }
    async getFilterOptions(type) {
        const cacheKey = `${this.CACHE_PREFIX}filter-options:${type || 'all'}`;
        const cached = await this.redis.getJson(cacheKey);
        if (cached)
            return cached;
        let refNos = [];
        let frameNos = [];
        if (!type || type === 'master-mills') {
            const [refRows, frameRows] = await Promise.all([
                this.prisma.masterMill.findMany({
                    where: { deleted_at: null, ref_no: { not: null } },
                    select: { ref_no: true },
                    distinct: ['ref_no'],
                    orderBy: { ref_no: 'asc' },
                }),
                this.prisma.masterMill.findMany({
                    where: { deleted_at: null, frame_no: { not: null } },
                    select: { frame_no: true },
                    distinct: ['frame_no'],
                    orderBy: { frame_no: 'asc' },
                }),
            ]);
            refNos = refRows.map((r) => r.ref_no).filter(Boolean);
            frameNos = frameRows.map((r) => r.frame_no).filter(Boolean);
        }
        else if (type === 'services' || type === 'expenses') {
            const [millRows, frameRows] = await Promise.all([
                this.prisma.mill.findMany({
                    where: { deleted_at: null, ref_no: { not: null } },
                    select: { ref_no: true },
                    distinct: ['ref_no'],
                    orderBy: { ref_no: 'asc' },
                }),
                this.prisma.serviceReport.findMany({
                    where: { deleted_at: null, serial_or_frame_no: { gt: '' } },
                    select: { serial_or_frame_no: true },
                    distinct: ['serial_or_frame_no'],
                    orderBy: { serial_or_frame_no: 'asc' },
                }),
            ]);
            refNos = millRows.map((r) => r.ref_no).filter(Boolean);
            frameNos = frameRows.map((r) => r.serial_or_frame_no).filter(Boolean);
        }
        else if (type === 'installations') {
            const [millRows, frameRows] = await Promise.all([
                this.prisma.mill.findMany({
                    where: { deleted_at: null, ref_no: { not: null } },
                    select: { ref_no: true },
                    distinct: ['ref_no'],
                    orderBy: { ref_no: 'asc' },
                }),
                this.prisma.installationReport.findMany({
                    where: { deleted_at: null, serial_or_frame_no: { gt: '' } },
                    select: { serial_or_frame_no: true },
                    distinct: ['serial_or_frame_no'],
                    orderBy: { serial_or_frame_no: 'asc' },
                }),
            ]);
            refNos = millRows.map((r) => r.ref_no).filter(Boolean);
            frameNos = frameRows.map((r) => r.serial_or_frame_no).filter(Boolean);
        }
        const result = { refNos, frameNos };
        await this.redis.setJson(cacheKey, result, 300);
        return result;
    }
    async invalidateCache() {
        await this.redis.delByPrefix(this.CACHE_PREFIX);
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        settings_service_1.SettingsService,
        pdf_service_1.PdfService,
        document_template_service_1.DocumentTemplateService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map