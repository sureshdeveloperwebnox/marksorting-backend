import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { CreateServiceReportDto } from './dto/create-service-report.dto';
import { UpdateServiceReportDto } from './dto/update-service-report.dto';
import { CreateMobileServiceReportDto } from './dto/create-mobile-service-report.dto';
import { UpdateMobileServiceReportDto } from './dto/update-mobile-service-report.dto';

import { SettingsService } from '../settings/settings.service';
import { PdfService } from '../pdf/pdf.service';
import { DocumentTemplateService } from '../pdf/templates/document-template.service';
import {
  CompanyPdfSettings,
  renderServiceReportPdfOptions,
  renderServiceReportTemplate,
} from '../pdf/templates/service-report.template';

const INCLUDE_SHAPE = {
  mill: { select: { id: true, name: true } },
  serviceCategory: { select: { id: true, name: true } },
  technicians: {
    include: { technician: { select: { id: true, full_name: true } } },
  },
} as const;

@Injectable()
export class ServiceReportsService {
  private readonly CACHE_PREFIX = 'service-report:';
  private readonly LIST_CACHE_KEY = 'service-reports:list:';

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private settingsService: SettingsService,
    private pdfService: PdfService,
    private documentTemplateService: DocumentTemplateService,
    private eventEmitter: EventEmitter2,
  ) {}

  async findAll(
    params: {
      skip?: number;
      take?: number;
      search?: string;
      status?: string;
      serviceCategoryId?: string;
      dateFrom?: string;
      dateTo?: string;
    },
    user?: { userId: string; role: string },
  ) {
    const cacheKey = `${this.LIST_CACHE_KEY}${JSON.stringify({ params, user })}`;
    const cachedData = await this.redis.getJson<any>(cacheKey);
    if (cachedData) return cachedData;

    const { skip, take, search, status, serviceCategoryId, dateFrom, dateTo } =
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
        { nature_of_complaint: { contains: search, mode: 'insensitive' } },
        { authorized_person: { contains: search, mode: 'insensitive' } },
        { mill: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (serviceCategoryId) {
      where.service_category_id = serviceCategoryId;
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

    const [serviceReports, total] = await Promise.all([
      this.prisma.serviceReport.findMany({
        skip,
        take,
        where,
        include: INCLUDE_SHAPE,
      }),
      this.prisma.serviceReport.count({ where }),
    ]);

    const result = { serviceReports, total };
    await this.redis.setJson(cacheKey, result, 300); // Cache for 5 mins
    return result;
  }

  async findById(id: string, user?: { userId: string; role: string }) {
    const cacheKey = `${this.CACHE_PREFIX}id:${id}:${user?.userId || 'all'}`;
    const cached = await this.redis.getJson<any>(cacheKey);
    if (cached) return cached;

    const serviceReport = await this.prisma.serviceReport.findFirst({
      where: { id, deleted_at: null },
      include: INCLUDE_SHAPE,
    });

    if (!serviceReport) {
      throw new NotFoundException(`Service report with ID "${id}" not found`);
    }

    if (user && user.role === 'Service Engineer') {
      const isAssigned = serviceReport.technicians.some(
        (t) => t.technician_id === user.userId,
      );
      if (!isAssigned) {
        throw new ForbiddenException(
          'You do not have permission to access this service report',
        );
      }
    }

    await this.redis.setJson(cacheKey, serviceReport, 3600); // Cache for 1 hour
    return serviceReport;
  }

  async create(
    dto: CreateServiceReportDto | CreateMobileServiceReportDto,
    user?: { userId: string; role: string },
  ) {
    const rawDto = dto as any;
    const { technician_ids, ...reportData } = rawDto;
    delete reportData.customer_id;
    delete reportData.technician_id;

    const finalTechnicianIds = [...(technician_ids || [])];
    if (rawDto.technician_id && !finalTechnicianIds.includes(rawDto.technician_id)) {
      finalTechnicianIds.push(rawDto.technician_id);
    }
    if (
      user &&
      user.role === 'Service Engineer' &&
      !finalTechnicianIds.includes(user.userId)
    ) {
      finalTechnicianIds.push(user.userId);
    }

    const serviceReport = await this.prisma.$transaction(async (tx) => {
      // Compute today's UTC date boundaries
      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setUTCHours(23, 59, 59, 999);

      // Count reports created today
      const count = await tx.serviceReport.count({
        where: { created_at: { gte: todayStart, lte: todayEnd } },
      });

      // Format: SR-YYYYMMDD-X (unpadded sequence, starting at 1)
      const dateStr = todayStart.toISOString().slice(0, 10).replace(/-/g, '');
      const seq = String(count + 1);
      const report_number = `SR-${dateStr}-${seq}`;

      // Insert the service report record
      const created = await tx.serviceReport.create({
        data: {
          ...reportData,
          report_number,
          visit_date: new Date(reportData.visit_date),
          call_registered_date: new Date(reportData.call_registered_date),
          machine_mfg_date: reportData.machine_mfg_date
            ? new Date(reportData.machine_mfg_date)
            : undefined,
          machine_installation_date: reportData.machine_installation_date
            ? new Date(reportData.machine_installation_date)
            : undefined,
        },
        include: INCLUDE_SHAPE,
      });

      // Create ServiceReportTechnician join rows
      await tx.serviceReportTechnician.createMany({
        data: finalTechnicianIds.map((tid) => ({
          service_report_id: created.id,
          technician_id: tid,
        })),
      });

      // Re-fetch with technicians included
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

      // Emit event for automatic PDF delivery via WhatsApp and Email
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

  async update(
    id: string,
    dto: UpdateServiceReportDto | UpdateMobileServiceReportDto,
    user?: { userId: string; role: string },
  ) {
    const existingReport = await this.findById(id, user);

    const rawDto = dto as any;
    const { technician_ids, ...reportData } = rawDto;
    delete reportData.customer_id;
    delete reportData.technician_id;

    let finalTechnicianIds = technician_ids !== undefined ? [...technician_ids] : undefined;
    if (rawDto.technician_id !== undefined) {
      if (finalTechnicianIds !== undefined) {
        if (rawDto.technician_id && !finalTechnicianIds.includes(rawDto.technician_id)) {
          finalTechnicianIds.push(rawDto.technician_id);
        }
      } else {
        finalTechnicianIds = rawDto.technician_id ? [rawDto.technician_id] : [];
      }
    }

    const updateData: any = { ...reportData };

    if (reportData.visit_date !== undefined) {
      updateData.visit_date = new Date(reportData.visit_date);
    }
    if (reportData.call_registered_date !== undefined) {
      updateData.call_registered_date = new Date(
        reportData.call_registered_date,
      );
    }
    if (reportData.machine_mfg_date !== undefined) {
      updateData.machine_mfg_date = reportData.machine_mfg_date
        ? new Date(reportData.machine_mfg_date)
        : null;
    }
    if (reportData.machine_installation_date !== undefined) {
      updateData.machine_installation_date =
        reportData.machine_installation_date
          ? new Date(reportData.machine_installation_date)
          : null;
    }

    const serviceReport = await this.prisma.serviceReport.update({
      where: { id },
      data: updateData,
      include: INCLUDE_SHAPE,
    });

    // Sync technician join table
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

  async remove(id: string, user?: { userId: string; role: string }) {
    await this.findById(id, user);

    const serviceReport = await this.prisma.serviceReport.update({
      where: { id },
      data: { deleted_at: new Date() },
      include: INCLUDE_SHAPE,
    });

    await this.invalidateCache(id);
    return serviceReport;
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
    const html = renderServiceReportTemplate(
      { report, company },
      this.documentTemplateService,
    );
    const buffer = await this.pdfService.renderHtmlToPdf(
      html,
      renderServiceReportPdfOptions(company, this.documentTemplateService),
    );

    return {
      buffer,
      fileName: `service-report-${report.report_number}.pdf`,
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
}
