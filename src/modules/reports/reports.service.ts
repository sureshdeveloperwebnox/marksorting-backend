import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { SettingsService } from '../settings/settings.service';
import { PdfService } from '../pdf/pdf.service';
import { DocumentTemplateService } from '../pdf/templates/document-template.service';
import {
  renderTabularReportPdfOptions,
  renderTabularReportTemplate,
  CompanyPdfSettings,
} from './templates/reports.template';
import * as XLSX from 'xlsx';

interface ReportParams {
  skip?: number;
  take?: number;
  search?: string;
  status?: string;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  millId?: string;
  technicianId?: string;
}

interface UserSessionPayload {
  userId: string;
  role: string;
}

@Injectable()
export class ReportsService {
  private readonly CACHE_PREFIX = 'reports:';

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private settingsService: SettingsService,
    private pdfService: PdfService,
    private documentTemplateService: DocumentTemplateService,
  ) { }

  // ─── SERVICES REPORT ───────────────────────────────────────────────────────

  private getServicesWhereClause(
    params: ReportParams,
    user: UserSessionPayload,
  ) {
    const {
      search,
      status,
      categoryId,
      dateFrom,
      dateTo,
      millId,
      technicianId,
    } = params;
    const where: any = { deleted_at: null };

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
        // Merge with existing Service Engineer restriction
        where.technicians.some.technician_id = technicianId;
      } else {
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

  async getServices(params: ReportParams, user: UserSessionPayload) {
    const cacheKey = `${this.CACHE_PREFIX}services:${JSON.stringify({ params, user })}`;
    const cached = await this.redis.getJson<any>(cacheKey);
    if (cached) return cached;

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

    // Compute status counts for metrics card
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

    await this.redis.setJson(cacheKey, result, 300); // 5 mins cache
    return result;
  }

  async exportServices(
    params: ReportParams,
    user: UserSessionPayload,
    formatType: 'pdf' | 'csv' | 'excel',
  ) {
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
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
    }

    if (formatType === 'pdf') {
      // Get statuses
      const pending = reports.filter((r) => r.status === 'PENDING').length;
      const inProgress = reports.filter(
        (r) => r.status === 'IN_PROGRESS',
      ).length;
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
          this.documentTemplateService.escape(
            r.technicians.map((t) => t.technician?.full_name).join(', '),
          ),
          `<span class="status-badge status-${r.status.toLowerCase().replace(/_/g, '')}">${r.status}</span>`,
        ]),
        company: await this.getCompanyPdfSettings(),
      };

      pdfData.company.logoUrl = await this.pdfService.embedImageAsDataUrl(
        pdfData.company.logoUrl,
      );

      const html = renderTabularReportTemplate(
        pdfData,
        this.documentTemplateService,
      );
      const buffer = await this.pdfService.renderHtmlToPdf(
        html,
        renderTabularReportPdfOptions(
          pdfData.company,
          this.documentTemplateService,
        ),
      );

      return {
        buffer,
        fileName: `service_reports_${Date.now()}.pdf`,
        contentType: 'application/pdf',
      };
    }

    throw new BadRequestException(`Format type ${formatType} is not supported`);
  }

  // ─── INSTALLATIONS REPORT ──────────────────────────────────────────────────

  private getInstallationsWhereClause(
    params: ReportParams,
    user: UserSessionPayload,
  ) {
    const { search, status, dateFrom, dateTo, millId, technicianId } = params;
    const where: any = { deleted_at: null };

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
      } else {
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

  async getInstallations(params: ReportParams, user: UserSessionPayload) {
    const cacheKey = `${this.CACHE_PREFIX}installations:${JSON.stringify({ params, user })}`;
    const cached = await this.redis.getJson<any>(cacheKey);
    if (cached) return cached;

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

    // Compute status counts for metrics card
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

    await this.redis.setJson(cacheKey, result, 300); // 5 mins cache
    return result;
  }

  async exportInstallations(
    params: ReportParams,
    user: UserSessionPayload,
    formatType: 'pdf' | 'csv' | 'excel',
  ) {
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
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
    }

    if (formatType === 'pdf') {
      // Get statuses
      const pending = reports.filter((r) => r.status === 'PENDING').length;
      const inProgress = reports.filter(
        (r) => r.status === 'IN_PROGRESS',
      ).length;
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
          this.documentTemplateService.escape(
            r.technicians.map((t) => t.technician?.full_name).join(', '),
          ),
          `<span class="status-badge status-${r.status.toLowerCase().replace(/_/g, '')}">${r.status}</span>`,
        ]),
        company: await this.getCompanyPdfSettings(),
      };

      pdfData.company.logoUrl = await this.pdfService.embedImageAsDataUrl(
        pdfData.company.logoUrl,
      );

      const html = renderTabularReportTemplate(
        pdfData,
        this.documentTemplateService,
      );
      const buffer = await this.pdfService.renderHtmlToPdf(
        html,
        renderTabularReportPdfOptions(
          pdfData.company,
          this.documentTemplateService,
        ),
      );

      return {
        buffer,
        fileName: `installation_reports_${Date.now()}.pdf`,
        contentType: 'application/pdf',
      };
    }

    throw new BadRequestException(`Format type ${formatType} is not supported`);
  }

  // ─── EXPENSES REPORT ───────────────────────────────────────────────────────

  private getExpensesWhereClause(
    params: ReportParams,
    user: UserSessionPayload,
  ) {
    const {
      search,
      status,
      categoryId,
      dateFrom,
      dateTo,
      millId,
      technicianId,
    } = params;
    const where: any = { deleted_at: null };

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
      } else {
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

  async getExpenses(params: ReportParams, user: UserSessionPayload) {
    const cacheKey = `${this.CACHE_PREFIX}expenses:${JSON.stringify({ params, user })}`;
    const cached = await this.redis.getJson<any>(cacheKey);
    if (cached) return cached;

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

    // Compute status counts & total amount for statistics
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

      if (exp.status === 'PENDING') pendingCount++;
      else if (exp.status === 'IN_PROGRESS') inProgressCount++;
      else if (exp.status === 'COMPLETED') completedCount++;
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

    await this.redis.setJson(cacheKey, result, 300); // 5 mins cache
    return result;
  }

  async exportExpenses(
    params: ReportParams,
    user: UserSessionPayload,
    formatType: 'pdf' | 'csv' | 'excel',
  ) {
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
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
    }

    if (formatType === 'pdf') {
      // Aggregate total amount & statuses
      let totalAmount = 0;
      let pending = 0;
      let inProgress = 0;
      let completed = 0;

      reports.forEach((r) => {
        totalAmount += parseFloat(r.amount ? String(r.amount) : '0');
        if (r.status === 'PENDING') pending++;
        else if (r.status === 'IN_PROGRESS') inProgress++;
        else if (r.status === 'COMPLETED') completed++;
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
          this.documentTemplateService.escape(
            r.technicians.map((t) => t.technician?.full_name).join(', '),
          ),
          `<span class="status-badge status-${r.status.toLowerCase().replace(/_/g, '')}">${r.status}</span>`,
        ]),
        company: await this.getCompanyPdfSettings(),
      };

      pdfData.company.logoUrl = await this.pdfService.embedImageAsDataUrl(
        pdfData.company.logoUrl,
      );

      const html = renderTabularReportTemplate(
        pdfData,
        this.documentTemplateService,
      );
      const buffer = await this.pdfService.renderHtmlToPdf(
        html,
        renderTabularReportPdfOptions(
          pdfData.company,
          this.documentTemplateService,
        ),
      );

      return {
        buffer,
        fileName: `expense_reports_${Date.now()}.pdf`,
        contentType: 'application/pdf',
      };
    }

    throw new BadRequestException(`Format type ${formatType} is not supported`);
  }

  // ─── MASTER MILLS REPORT ───────────────────────────────────────────────────

  private getMasterMillsWhereClause(
    params: ReportParams,
    user: UserSessionPayload,
  ) {
    const { search, status, dateFrom, dateTo, millId } = params;
    const where: any = { deleted_at: null };

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

  async getMasterMills(params: ReportParams, user: UserSessionPayload) {
    const cacheKey = `${this.CACHE_PREFIX}master-mills:${JSON.stringify({ params, user })}`;
    const cached = await this.redis.getJson<any>(cacheKey);
    if (cached) return cached;

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

    // Compute status counts for metrics card based on the current filtered set
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

    await this.redis.setJson(cacheKey, result, 300); // 5 mins cache
    return result;
  }

  async exportMasterMills(
    params: ReportParams,
    user: UserSessionPayload,
    formatType: 'pdf' | 'csv' | 'excel',
  ) {
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
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
    }

    if (formatType === 'pdf') {
      const now = new Date();
      const underWarranty = reports.filter(
        (r) =>
          r.warranty_closing_date &&
          new Date(r.warranty_closing_date) >= now &&
          r.all_warranty !== 'Non Warranty',
      ).length;
      const underAmc = reports.filter(
        (r) =>
          r.amc_closing_date &&
          new Date(r.amc_closing_date) >= now &&
          r.amc_starting_date !== null,
      ).length;
      const nonWarranty = reports.filter(
        (r) => r.all_warranty === 'Non Warranty',
      ).length;

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

      pdfData.company.logoUrl = await this.pdfService.embedImageAsDataUrl(
        pdfData.company.logoUrl,
      );

      const html = renderTabularReportTemplate(
        pdfData,
        this.documentTemplateService,
      );
      const buffer = await this.pdfService.renderHtmlToPdf(
        html,
        renderTabularReportPdfOptions(
          pdfData.company,
          this.documentTemplateService,
        ),
      );

      return {
        buffer,
        fileName: `master_mills_report_${Date.now()}.pdf`,
        contentType: 'application/pdf',
      };
    }

    throw new BadRequestException(`Format type ${formatType} is not supported`);
  }

  // ─── HELPERS ───────────────────────────────────────────────────────────────

  private generateCsv(headers: string[], rows: string[][]): Buffer {
    const escapeCsvCell = (val: string) => {
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

  private generateExcel(
    sheetName: string,
    headers: string[],
    rows: string[][],
  ): Buffer {
    const workbook = XLSX.utils.book_new();
    const sheetData = [headers, ...rows];
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

    // Dynamic column width calculation
    const colWidths = headers.map((h, i) => {
      const maxLength = Math.max(
        h.length,
        ...rows.map((row) => (row[i] ? String(row[i]).length : 0)),
      );
      return { wch: Math.min(maxLength + 3, 50) }; // cap column width at 50 chars
    });
    worksheet['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    const excelBuffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    });
    return excelBuffer;
  }

  private getFiltersSummary(
    params: ReportParams,
  ): { label: string; value: string }[] {
    const list: { label: string; value: string }[] = [];
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

  private async getCompanyPdfSettings(): Promise<CompanyPdfSettings> {
    const data = await this.settingsService.findAll({
      skip: 0,
      take: 200,
      group: 'COMPANY',
    });
    const settings = new Map<string, string>(
      data.settings.map((setting: { key: string; value: string }) => [
        setting.key,
        setting.value,
      ]),
    );

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

  public async invalidateCache() {
    await this.redis.delByPrefix(this.CACHE_PREFIX);
  }
}
