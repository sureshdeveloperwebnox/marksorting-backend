import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { CreateInstallationReportDto } from './dto/create-installation-report.dto';
import { UpdateInstallationReportDto } from './dto/update-installation-report.dto';
import { SettingsService } from '../settings/settings.service';
import { PdfService } from '../pdf/pdf.service';
import { DocumentTemplateService } from '../pdf/templates/document-template.service';
import {
  CompanyPdfSettings,
  renderInstallationReportPdfOptions,
  renderInstallationReportTemplate,
} from '../pdf/templates/installation-report.template';

const INCLUDE_SHAPE = {
  mill: { select: { id: true, name: true } },
  technicians: {
    include: { technician: { select: { id: true, full_name: true } } },
  },
} as const;

@Injectable()
export class InstallationReportsService {
  private readonly CACHE_PREFIX = 'installation-report:';
  private readonly LIST_CACHE_KEY = 'installation-reports:list:';

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private settingsService: SettingsService,
    private pdfService: PdfService,
    private documentTemplateService: DocumentTemplateService,
  ) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    search?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const cacheKey = `${this.LIST_CACHE_KEY}${JSON.stringify(params)}`;
    const cachedData = await this.redis.getJson<any>(cacheKey);
    if (cachedData) return cachedData;

    const { skip, take, search, status, dateFrom, dateTo } = params;

    const where: any = { deleted_at: null };

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

    if (dateFrom || dateTo) {
      where.visit_date = {};
      if (dateFrom) {
        where.visit_date.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.visit_date.lte = new Date(dateTo);
      }
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

    const result = { installationReports, total };
    await this.redis.setJson(cacheKey, result, 300); // Cache for 5 mins
    return result;
  }

  async findById(id: string) {
    const cacheKey = `${this.CACHE_PREFIX}id:${id}`;
    const cached = await this.redis.getJson<any>(cacheKey);
    if (cached) return cached;

    const installationReport = await this.prisma.installationReport.findFirst({
      where: { id, deleted_at: null },
      include: INCLUDE_SHAPE,
    });

    if (!installationReport) {
      throw new NotFoundException(
        `Installation report with ID "${id}" not found`,
      );
    }

    await this.redis.setJson(cacheKey, installationReport, 3600); // Cache for 1 hour
    return installationReport;
  }

  async create(dto: CreateInstallationReportDto) {
    const { technician_ids, ...reportData } = dto;

    const installationReport = await this.prisma.$transaction(async (tx) => {
      // Compute today's UTC date boundaries
      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setUTCHours(23, 59, 59, 999);

      // Count reports created today
      const count = await tx.installationReport.count({
        where: { created_at: { gte: todayStart, lte: todayEnd } },
      });

      // Format: IR-YYYYMMDD-X (unpadded sequence, starting at 1)
      const dateStr = todayStart.toISOString().slice(0, 10).replace(/-/g, '');
      const seq = String(count + 1);
      const report_number = `IR-${dateStr}-${seq}`;

      // Insert the installation report record
      const created = await tx.installationReport.create({
        data: {
          ...reportData,
          report_number,
          visit_date: new Date(reportData.visit_date),
          call_registered_date: new Date(reportData.call_registered_date),
          invoice_date: reportData.invoice_date
            ? new Date(reportData.invoice_date)
            : undefined,
          warranty_start_date: reportData.warranty_start_date
            ? new Date(reportData.warranty_start_date)
            : undefined,
          warranty_end_date: reportData.warranty_end_date
            ? new Date(reportData.warranty_end_date)
            : undefined,
        },
        include: INCLUDE_SHAPE,
      });

      // Create InstallationReportTechnician join rows
      await tx.installationReportTechnician.createMany({
        data: technician_ids.map((tid) => ({
          installation_report_id: created.id,
          technician_id: tid,
        })),
      });

      // Re-fetch with technicians included
      return tx.installationReport.findFirst({
        where: { id: created.id },
        include: INCLUDE_SHAPE,
      });
    });

    await this.invalidateCache();
    return installationReport;
  }

  async update(id: string, dto: UpdateInstallationReportDto) {
    await this.findById(id);

    const { technician_ids, ...reportData } = dto;

    const updateData: any = { ...reportData };

    if (reportData.visit_date !== undefined) {
      updateData.visit_date = new Date(reportData.visit_date);
    }
    if (reportData.call_registered_date !== undefined) {
      updateData.call_registered_date = new Date(
        reportData.call_registered_date,
      );
    }
    if (reportData.invoice_date !== undefined) {
      updateData.invoice_date = reportData.invoice_date
        ? new Date(reportData.invoice_date)
        : null;
    }
    if (reportData.warranty_start_date !== undefined) {
      updateData.warranty_start_date = reportData.warranty_start_date
        ? new Date(reportData.warranty_start_date)
        : null;
    }
    if (reportData.warranty_end_date !== undefined) {
      updateData.warranty_end_date = reportData.warranty_end_date
        ? new Date(reportData.warranty_end_date)
        : null;
    }

    const installationReport = await this.prisma.installationReport.update({
      where: { id },
      data: updateData,
      include: INCLUDE_SHAPE,
    });

    // Sync technician join table
    if (technician_ids !== undefined) {
      await this.prisma.installationReportTechnician.deleteMany({
        where: { installation_report_id: id },
      });
      await this.prisma.installationReportTechnician.createMany({
        data: technician_ids.map((tid) => ({
          installation_report_id: id,
          technician_id: tid,
        })),
      });
    }

    await this.invalidateCache(id);
    return installationReport;
  }

  async remove(id: string) {
    await this.findById(id);

    const installationReport = await this.prisma.installationReport.update({
      where: { id },
      data: { deleted_at: new Date() },
      include: INCLUDE_SHAPE,
    });

    await this.invalidateCache(id);
    return installationReport;
  }

  private async invalidateCache(id?: string) {
    const promises: Promise<any>[] = [
      this.redis.delByPrefix(this.LIST_CACHE_KEY),
    ];
    if (id) {
      promises.push(this.redis.del(`${this.CACHE_PREFIX}id:${id}`));
    }
    await Promise.all(promises);
  }

  async generatePdf(id: string): Promise<{ buffer: Buffer; fileName: string }> {
    const report = await this.findById(id);
    const company = await this.getCompanyPdfSettings();
    company.logoUrl = await this.pdfService.embedImageAsDataUrl(
      company.logoUrl,
    );
    const html = renderInstallationReportTemplate(
      { report, company },
      this.documentTemplateService,
    );
    const buffer = await this.pdfService.renderHtmlToPdf(
      html,
      renderInstallationReportPdfOptions(company, this.documentTemplateService),
    );

    return {
      buffer,
      fileName: `installation-report-${report.report_number}.pdf`,
    };
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
}
