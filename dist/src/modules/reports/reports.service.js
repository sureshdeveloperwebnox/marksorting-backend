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
        const { search, status, categoryId, dateFrom, dateTo, millId, technicianId, } = params;
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
        const [pendingCount, inProgressCount, completedCount] = await Promise.all([
            this.prisma.serviceReport.count({
                where: { ...where, status: 'PENDING' },
            }),
            this.prisma.serviceReport.count({
                where: { ...where, status: 'IN_PROGRESS' },
            }),
            this.prisma.serviceReport.count({
                where: { ...where, status: 'COMPLETED' },
            }),
        ]);
        const result = {
            reports,
            total,
            metrics: {
                totalCount: total,
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
        const { search, status, dateFrom, dateTo, millId, technicianId } = params;
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
        const [pendingCount, inProgressCount, completedCount] = await Promise.all([
            this.prisma.installationReport.count({
                where: { ...where, status: 'PENDING' },
            }),
            this.prisma.installationReport.count({
                where: { ...where, status: 'IN_PROGRESS' },
            }),
            this.prisma.installationReport.count({
                where: { ...where, status: 'COMPLETED' },
            }),
        ]);
        const result = {
            reports,
            total,
            metrics: {
                totalCount: total,
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
        const { search, status, categoryId, dateFrom, dateTo, millId, technicianId, } = params;
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
        const expensesAggregated = await this.prisma.expense.findMany({
            where,
            select: {
                amount: true,
                status: true,
            },
        });
        let totalAmount = 0;
        let pendingCount = 0;
        let inProgressCount = 0;
        let completedCount = 0;
        for (const exp of expensesAggregated) {
            const amt = parseFloat(exp.amount ? String(exp.amount) : '0');
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
                totalCount: total,
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
            },
            orderBy: { visit_date: 'desc' },
        });
        const headers = [
            'Expense No',
            'Mill Name / Details',
            'Place',
            'Visit Date',
            'Category',
            'Amount (INR)',
            'Technicians',
            'Status',
        ];
        const data = reports.map((r) => [
            r.expense_number,
            r.mill?.name || r.others || '-',
            r.place || '-',
            r.visit_date ? r.visit_date.toISOString().slice(0, 10) : '-',
            r.expenseCategory?.name || '-',
            Number(r.amount || 0).toFixed(2),
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
                fileName: `expense_reports_${Date.now()}.csv`,
                contentType: 'text/csv',
            };
        }
        if (formatType === 'excel') {
            const buffer = this.generateExcel('Expenses', headers, data);
            return {
                buffer,
                fileName: `expense_reports_${Date.now()}.xlsx`,
                contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            };
        }
        if (formatType === 'pdf') {
            let totalAmount = 0;
            let pending = 0;
            let inProgress = 0;
            let completed = 0;
            reports.forEach((r) => {
                totalAmount += parseFloat(r.amount ? String(r.amount) : '0');
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
                rows: reports.map((r) => [
                    `<span class="font-semibold">${this.documentTemplateService.escape(r.expense_number)}</span>`,
                    this.documentTemplateService.escape(r.mill?.name || r.others),
                    this.documentTemplateService.escape(r.place),
                    this.documentTemplateService.date(r.visit_date),
                    `<span class="status-badge" style="background:#f3f4f6; color:#4b5563;">${this.documentTemplateService.escape(r.expenseCategory?.name)}</span>`,
                    `<span class="font-semibold">₹${Number(r.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>`,
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
                fileName: `expense_reports_${Date.now()}.pdf`,
                contentType: 'application/pdf',
            };
        }
        throw new common_1.BadRequestException(`Format type ${formatType} is not supported`);
    }
    getMasterMillsWhereClause(params, user) {
        const { search, status, dateFrom, dateTo, millId } = params;
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
        const now = new Date();
        const [underWarrantyCount, underAmcCount, nonWarrantyCount] = await Promise.all([
            this.prisma.masterMill.count({
                where: {
                    ...where,
                    warranty_closing_date: { gte: now },
                    all_warranty: { not: 'Non Warranty' },
                },
            }),
            this.prisma.masterMill.count({
                where: {
                    ...where,
                    amc_closing_date: { gte: now },
                    amc_starting_date: { not: null },
                },
            }),
            this.prisma.masterMill.count({
                where: { ...where, all_warranty: 'Non Warranty' },
            }),
        ]);
        const result = {
            reports,
            total,
            metrics: {
                totalCount: total,
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
                mill: { select: { id: true, name: true } },
            },
            orderBy: { installation_date: 'desc' },
        });
        const headers = [
            'Ref No / Frame No',
            'Mill Name',
            'Place',
            'Machine Model',
            'Installation Date',
            'Warranty Status',
            'AMC Period',
            'Status',
        ];
        const data = reports.map((r) => [
            `${r.ref_no || '-'} / ${r.frame_no || '-'}`,
            r.mill?.name || '-',
            r.place || '-',
            r.mc_model || '-',
            r.installation_date ? r.installation_date.toISOString().slice(0, 10) : '-',
            r.all_warranty || 'Non Warranty',
            r.amc_period ? `${r.amc_period} Months` : '-',
            r.status,
        ]);
        if (formatType === 'csv') {
            const buffer = this.generateCsv(headers, data);
            return {
                buffer,
                fileName: `master_mills_report_${Date.now()}.csv`,
                contentType: 'text/csv',
            };
        }
        if (formatType === 'excel') {
            const buffer = this.generateExcel('Master Mills', headers, data);
            return {
                buffer,
                fileName: `master_mills_report_${Date.now()}.xlsx`,
                contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            };
        }
        if (formatType === 'pdf') {
            const now = new Date();
            const underWarranty = reports.filter((r) => r.warranty_closing_date &&
                new Date(r.warranty_closing_date) >= now &&
                r.all_warranty !== 'Non Warranty').length;
            const underAmc = reports.filter((r) => r.amc_closing_date &&
                new Date(r.amc_closing_date) >= now &&
                r.amc_starting_date !== null).length;
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
    generateExcel(sheetName, headers, rows) {
        const workbook = XLSX.utils.book_new();
        const sheetData = [headers, ...rows];
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