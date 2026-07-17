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
import { Prisma } from '@prisma/client';

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
  millName?: string;
  frameNo?: string;
  refNo?: string;
  // Store filters
  serviceEngineerId?: string;
  customerId?: string;
  materialId?: string;
  warrantyStatus?: string;
  returnStatus?: string;
  inflowStatus?: string;
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
      millName,
      frameNo,
      refNo,
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

    // Compute status counts for metrics card without status filter
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
          this.documentTemplateService.escape(r.action_taken),
          this.documentTemplateService.escape(r.engineer_remarks),
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
    const { search, status, dateFrom, dateTo, millId, technicianId, millName, frameNo, refNo } = params;
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

    // Compute status counts for metrics card without status filter
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
      millName,
      frameNo,
      refNo,
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
      } else {
        where.OR = [
          { serviceReport: { serial_or_frame_no: { contains: frameNo, mode: 'insensitive' } } },
          { installationReport: { serial_or_frame_no: { contains: frameNo, mode: 'insensitive' } } },
        ];
      }
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

    const { status, ...whereWithoutStatus } = where;

    // Compute status counts & total amount for statistics without status filter
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
      const adminAmt = parseFloat(
        exp.admin_amount ? String(exp.admin_amount) : '0',
      );
      const amt =
        adminAmt > 0
          ? adminAmt
          : parseFloat(exp.amount ? String(exp.amount) : '0');
      totalAmount += amt;

      if (exp.status === 'PENDING') pendingCount++;
      else if (exp.status === 'IN_PROGRESS') inProgressCount++;
      else if (exp.status === 'COMPLETED') completedCount++;
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

    const usedCategoriesSet = new Set<string>();
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

    const categoryNames = Array.from(
      new Set([
        ...activeCategories.map((c) => c.name),
        ...Array.from(usedCategoriesSet),
      ]),
    ).sort();

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
      const categoryAmounts: Record<string, number> = {};
      categoryNames.forEach((cat) => {
        categoryAmounts[cat] = 0;
      });

      if (r.expense_items && r.expense_items.length > 0) {
        r.expense_items.forEach((item) => {
          const catName = item.expenseCategory?.name;
          if (catName) {
            const itemAdminAmt = Number(item.admin_amount || 0);
            const itemDisplayAmt =
              itemAdminAmt > 0 ? itemAdminAmt : Number(item.amount || 0);
            categoryAmounts[catName] =
              (categoryAmounts[catName] || 0) + itemDisplayAmt;
          }
        });
      } else {
        const catName = r.expenseCategory?.name;
        if (catName) {
          const adminAmt = Number(r.admin_amount || 0);
          const displayAmt = adminAmt > 0 ? adminAmt : Number(r.amount || 0);
          categoryAmounts[catName] = displayAmt;
        }
      }

      const totalDisplayAmt = Object.values(categoryAmounts).reduce(
        (sum, val) => sum + val,
        0,
      );
      const categoryCols = categoryNames.map((cat) =>
        Math.round(categoryAmounts[cat] || 0),
      );

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
      let headerBlock: any[][] | undefined = undefined;
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
        const adminAmt = parseFloat(
          r.admin_amount ? String(r.admin_amount) : '0',
        );
        const amt =
          adminAmt > 0
            ? adminAmt
            : parseFloat(r.amount ? String(r.amount) : '0');
        totalAmount += amt;
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
        rows: reports.map((r) => {
          const categoryAmounts: Record<string, number> = {};
          categoryNames.forEach((cat) => {
            categoryAmounts[cat] = 0;
          });

          if (r.expense_items && r.expense_items.length > 0) {
            r.expense_items.forEach((item) => {
              const catName = item.expenseCategory?.name;
              if (catName) {
                const itemAdminAmt = Number(item.admin_amount || 0);
                const itemDisplayAmt =
                  itemAdminAmt > 0 ? itemAdminAmt : Number(item.amount || 0);
                categoryAmounts[catName] =
                  (categoryAmounts[catName] || 0) + itemDisplayAmt;
              }
            });
          } else {
            const catName = r.expenseCategory?.name;
            if (catName) {
              const adminAmt = Number(r.admin_amount || 0);
              const displayAmt =
                adminAmt > 0 ? adminAmt : Number(r.amount || 0);
              categoryAmounts[catName] = displayAmt;
            }
          }

          const totalDisplayAmt = Object.values(categoryAmounts).reduce(
            (sum, val) => sum + val,
            0,
          );
          const categoryColsHtml = categoryNames.map(
            (cat) =>
              `₹${categoryAmounts[cat].toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          );

          return [
            `<span class="font-semibold">${this.documentTemplateService.escape(r.expense_number)}</span>`,
            this.documentTemplateService.escape(r.mill?.name || r.others),
            this.documentTemplateService.escape(r.place),
            this.documentTemplateService.date(r.visit_date),
            ...categoryColsHtml,
            `<span class="font-semibold">₹${totalDisplayAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>`,
            this.documentTemplateService.escape(
              r.technicians.map((t) => t.technician?.full_name).join(', '),
            ),
            `<span class="status-badge status-${r.status.toLowerCase().replace(/_/g, '')}">${r.status}</span>`,
          ];
        }),
        company: await this.getCompanyPdfSettings(),
      };

      pdfData.company.logoUrl = await this.pdfService.embedImageAsDataUrl(
        pdfData.company.logoUrl,
      );

      const html = renderTabularReportTemplate(
        pdfData,
        this.documentTemplateService,
      );
      // Make the PDF landscape to accommodate the extra category columns
      const landscapeHtml = html.replace(
        '@page { size: A4; }',
        '@page { size: A4 landscape; }',
      );

      const pdfOptions = renderTabularReportPdfOptions(
        pdfData.company,
        this.documentTemplateService,
      );
      pdfOptions.landscape = true;

      const buffer = await this.pdfService.renderHtmlToPdf(
        landscapeHtml,
        pdfOptions,
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
    const { search, status, dateFrom, dateTo, millId, millName, frameNo, refNo } = params;
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

    // Compute status counts for metrics card based on the current filtered set without status filter
    const { status, ...whereWithoutStatus } = where;
    const now = new Date();
    const [underWarrantyCount, underAmcCount, nonWarrantyCount, totalCount] =
      await Promise.all([
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
      r.installation_date
        ? r.installation_date.toISOString().slice(0, 10)
        : '-',
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
        (r) => r.all_warranty === 'Under Warranty',
      ).length;
      const underAmc = reports.filter(
        (r) => r.all_warranty === 'Under AMC',
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

  private generateCsv(headers: string[], rows: any[][]): Buffer {
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
    rows: any[][],
    headerBlock?: any[][],
  ): Buffer {
    const workbook = XLSX.utils.book_new();
    const sheetData = headerBlock ? [...headerBlock, headers, ...rows] : [headers, ...rows];
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

  private getStoresWhereClause(
    params: ReportParams,
    user: UserSessionPayload,
  ) {
    const {
      search,
      serviceEngineerId,
      customerId,
      materialId,
      warrantyStatus,
      returnStatus,
      inflowStatus,
      dateFrom,
      dateTo,
    } = params;
    const where: Prisma.StoreWhereInput = { deleted_at: null };

    // Service Engineers can only see stores assigned to them
    if (user && user.role === 'Service Engineer') {
      where.service_engineer_id = user.userId;
    } else if (serviceEngineerId) {
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

  async getStores(params: ReportParams, user: UserSessionPayload) {
    const cacheKey = `${this.CACHE_PREFIX}stores:${JSON.stringify(params)}:${JSON.stringify(user)}`;
    const cached = await this.redis.getJson<any>(cacheKey);
    if (cached) return cached;

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

    const result = {
      total,
      stores,
      metrics: {
        totalCount: total,
        returnedCount,
        pendingCount,
        notReturnedCount,
        completedCount,
      },
    };
    await this.redis.setJson(cacheKey, result, 300); // 5 mins cache
    return result;
  }

  async exportStores(
    params: ReportParams,
    user: UserSessionPayload,
    formatType: 'pdf' | 'csv' | 'excel',
  ): Promise<{ buffer: Buffer; fileName: string; contentType: string } | null> {
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

    const headers = [
      'Service Engineer',
      'Customer',
      'Materials',
      'Qty',
      'Warranty Status',
      'Return Status',
      'Stock Status',
      'Barcode',
      'Created At',
    ];

    const data = reports.map((r) => {
      const materialsStr = r.materials
        .map((m) => `${m.material.name} (x${m.quantity || 1})`)
        .join(', ') || '-';
      return [
        r.service_engineer?.full_name || '-',
        r.customer?.name || '-',
        materialsStr,
        String(r.quantity),
        r.warranty_status || '-',
        r.return_status || '-',
        r.inflow_status || '-',
        r.barcode || '-',
        r.created_at ? r.created_at.toISOString().slice(0, 10) : '-',
      ];
    });

    if (formatType === 'csv') {
      const buffer = this.generateCsv(headers, data);
      return {
        buffer,
        fileName: `stores_report_${Date.now()}.csv`,
        contentType: 'text/csv',
      };
    }

    if (formatType === 'excel') {
      const buffer = this.generateExcel('Stores', headers, data);
      return {
        buffer,
        fileName: `stores_report_${Date.now()}.xlsx`,
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
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
        fileName: `stores_report_${Date.now()}.pdf`,
        contentType: 'application/pdf',
      };
    }

    return null;
  }

  public async invalidateCache() {
    await this.redis.delByPrefix(this.CACHE_PREFIX);
  }
}
