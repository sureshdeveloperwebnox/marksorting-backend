import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { CreateInstallationReportDto } from './dto/create-installation-report.dto';
import { UpdateInstallationReportDto } from './dto/update-installation-report.dto';
import { CreateMobileInstallationReportDto } from './dto/create-mobile-installation-report.dto';
import { UpdateMobileInstallationReportDto } from './dto/update-mobile-installation-report.dto';
import { getAutoVisitTime } from '../../common/utils/date-time';

import { SettingsService } from '../settings/settings.service';
import { PdfService } from '../pdf/pdf.service';
import { DocumentTemplateService } from '../pdf/templates/document-template.service';
import {
  CompanyPdfSettings,
  renderInstallationReportPdfOptions,
  renderInstallationReportTemplate,
} from '../pdf/templates/installation-report.template';

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
} as const;

const createDateBoundary = (
  dateValue: string,
  boundary: 'start' | 'end',
): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);
  if (!match) return null;

  const [, year, month, day] = match;
  const yearValue = Number(year);
  const monthValue = Number(month);
  const dayValue = Number(day);
  const dateOnly = new Date(Date.UTC(yearValue, monthValue - 1, dayValue));
  if (
    dateOnly.getUTCFullYear() !== yearValue ||
    dateOnly.getUTCMonth() !== monthValue - 1 ||
    dateOnly.getUTCDate() !== dayValue
  ) {
    return null;
  }

  const kolkataOffsetMs = 5.5 * 60 * 60 * 1000;
  const utcTime = Date.UTC(
    yearValue,
    monthValue - 1,
    dayValue,
    boundary === 'start' ? 0 : 23,
    boundary === 'start' ? 0 : 59,
    boundary === 'start' ? 0 : 59,
    boundary === 'start' ? 0 : 999,
  );

  const date = new Date(utcTime - kolkataOffsetMs);
  if (Number.isNaN(date.getTime())) return null;

  return date;
};

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
    private eventEmitter: EventEmitter2,
  ) { }

  async findAll(
    params: {
      skip?: number;
      take?: number;
      search?: string;
      status?: string;
      technicianId?: string;
      customerId?: string;
      millId?: string;
      dateFrom?: string;
      dateTo?: string;
    },
    user?: { userId: string; role: string },
  ) {
    const cacheKey = `${this.LIST_CACHE_KEY}${JSON.stringify({ params, user })}`;
    const cachedData = await this.redis.getJson<any>(cacheKey);
    if (cachedData) return cachedData;

    const { skip, take, search, status, technicianId, customerId, millId, dateFrom, dateTo } =
      params;

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
      } else {
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
        const toDate = createDateBoundary(dateTo || dateFrom!, 'end');
        if (toDate) {
          where.visit_date.lte = toDate;
        }
      }
      if (Object.keys(where.visit_date).length === 0) {
        delete where.visit_date;
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

  async findById(id: string, user?: { userId: string; role: string }) {
    const cacheKey = `${this.CACHE_PREFIX}id:${id}:${user?.userId || 'all'}`;
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

    if (user && user.role === 'Service Engineer') {
      const isAssigned = installationReport.technicians.some(
        (t) => t.technician_id === user.userId,
      );
      if (!isAssigned) {
        throw new ForbiddenException(
          'You do not have permission to access this installation report',
        );
      }
    }

    await this.redis.setJson(cacheKey, installationReport, 3600); // Cache for 1 hour
    return installationReport;
  }

  async create(
    dto: CreateInstallationReportDto | CreateMobileInstallationReportDto,
    user?: { userId: string; role: string },
  ) {
    const rawDto = dto as any;

    if ((!rawDto.mill_whatsapp_number || !rawDto.mill_email) && rawDto.mill_id) {
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
    if (
      rawDto.technician_id &&
      !finalTechnicianIds.includes(rawDto.technician_id)
    ) {
      finalTechnicianIds.push(rawDto.technician_id);
    }
    if (
      user &&
      user.role === 'Service Engineer' &&
      !finalTechnicianIds.includes(user.userId)
    ) {
      finalTechnicianIds.push(user.userId);
    }

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
          visit_time: (reportData.visit_time && reportData.visit_time.trim()) ? reportData.visit_time : getAutoVisitTime(),
          visit_date: new Date(reportData.visit_date),
          call_registered_date: new Date(reportData.call_registered_date),
          invoice_date: (reportData.invoice_date && reportData.invoice_date.trim())
            ? new Date(reportData.invoice_date)
            : undefined,
          warranty_start_date: (reportData.warranty_start_date && reportData.warranty_start_date.trim())
            ? new Date(reportData.warranty_start_date)
            : undefined,
          warranty_end_date: (reportData.warranty_end_date && reportData.warranty_end_date.trim())
            ? new Date(reportData.warranty_end_date)
            : undefined,
        },
        include: INCLUDE_SHAPE,
      });

      // Create InstallationReportTechnician join rows
      await tx.installationReportTechnician.createMany({
        data: finalTechnicianIds.map((tid) => ({
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

    if (installationReport) {
      this.eventEmitter.emit('installation-report.created', {
        reportNumber: installationReport.report_number,
        millName: installationReport.mill?.name || '',
        technicianUserIds: finalTechnicianIds,
        creatorUserId: user?.userId,
      });

      // Emit event for automatic PDF delivery via WhatsApp and Email
      this.eventEmitter.emit('installation-report.created.send-pdf', {
        reportId: installationReport.id,
        reportNumber: installationReport.report_number,
        millId: installationReport.mill?.id,
        millName: installationReport.mill?.name || '',
        millWhatsappNumber: rawDto.mill_whatsapp_number,
        millEmail: rawDto.mill_email,
      });
    }

    return installationReport;
  }

  async update(
    id: string,
    dto: UpdateInstallationReportDto | UpdateMobileInstallationReportDto,
    user?: { userId: string; role: string },
  ) {
    const existingReport = await this.findById(id, user);

    const rawDto = dto as any;

    if ((!rawDto.mill_whatsapp_number || !rawDto.mill_email) && rawDto.mill_id) {
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

    let finalTechnicianIds =
      technician_ids !== undefined ? [...technician_ids] : undefined;
    if (rawDto.technician_id !== undefined) {
      if (finalTechnicianIds !== undefined) {
        if (
          rawDto.technician_id &&
          !finalTechnicianIds.includes(rawDto.technician_id)
        ) {
          finalTechnicianIds.push(rawDto.technician_id);
        }
      } else {
        finalTechnicianIds = rawDto.technician_id ? [rawDto.technician_id] : [];
      }
    }

    const updateData: any = { ...reportData };

    if (reportData.visit_time !== undefined) {
      updateData.visit_time = (reportData.visit_time && reportData.visit_time.trim())
        ? reportData.visit_time
        : getAutoVisitTime();
    }
    if (reportData.visit_date !== undefined) {
      updateData.visit_date = new Date(reportData.visit_date);
    }
    if (reportData.call_registered_date !== undefined) {
      updateData.call_registered_date = new Date(
        reportData.call_registered_date,
      );
    }
    if (reportData.invoice_date !== undefined) {
      updateData.invoice_date = (reportData.invoice_date && reportData.invoice_date.trim())
        ? new Date(reportData.invoice_date)
        : null;
    }
    if (reportData.warranty_start_date !== undefined) {
      updateData.warranty_start_date = (reportData.warranty_start_date && reportData.warranty_start_date.trim())
        ? new Date(reportData.warranty_start_date)
        : null;
    }
    if (reportData.warranty_end_date !== undefined) {
      updateData.warranty_end_date = (reportData.warranty_end_date && reportData.warranty_end_date.trim())
        ? new Date(reportData.warranty_end_date)
        : null;
    }

    const installationReport = await this.prisma.installationReport.update({
      where: { id },
      data: updateData,
      include: INCLUDE_SHAPE,
    });

    // Sync technician join table
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

    await this.invalidateCache(id);
    return { before: existingReport, after: installationReport };
  }

  async remove(id: string, user?: { userId: string; role: string }) {
    await this.findById(id, user);

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
      this.redis.delByPrefix('reports:'),
    ];
    if (id) {
      promises.push(this.redis.delByPrefix(`${this.CACHE_PREFIX}id:${id}`));
    }
    await Promise.all(promises);
  }

  async generatePdf(
    id: string,
    user?: { userId: string; role: string },
  ): Promise<{ buffer: Buffer; fileName: string }> {
    const report = await this.findById(id, user);
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
