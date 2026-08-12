import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { CreateServiceReportDto } from './dto/create-service-report.dto';
import { UpdateServiceReportDto } from './dto/update-service-report.dto';
import { CreateMobileServiceReportDto } from './dto/create-mobile-service-report.dto';
import { UpdateMobileServiceReportDto } from './dto/update-mobile-service-report.dto';
import { MasterMillsService } from '../master-mills/master-mills.service';
import { SettingsService } from '../settings/settings.service';
import { PdfService } from '../pdf/pdf.service';
import { DocumentTemplateService } from '../pdf/templates/document-template.service';
export declare class ServiceReportsService {
    private prisma;
    private redis;
    private settingsService;
    private pdfService;
    private documentTemplateService;
    private eventEmitter;
    private masterMillsService;
    private readonly CACHE_PREFIX;
    private readonly LIST_CACHE_KEY;
    constructor(prisma: PrismaService, redis: RedisService, settingsService: SettingsService, pdfService: PdfService, documentTemplateService: DocumentTemplateService, eventEmitter: EventEmitter2, masterMillsService: MasterMillsService);
    findAll(params: {
        skip?: number;
        take?: number;
        search?: string;
        status?: string;
        serviceCategoryId?: string;
        technicianId?: string;
        customerId?: string;
        millId?: string;
        dateFrom?: string;
        dateTo?: string;
        expenseEligibleOnly?: boolean;
        excludeExpenseId?: string;
    }, user?: {
        userId: string;
        role: string;
    }): Promise<any>;
    findById(id: string, user?: {
        userId: string;
        role: string;
    }): Promise<any>;
    create(dto: CreateServiceReportDto | CreateMobileServiceReportDto, user?: {
        userId: string;
        role: string;
    }): Promise<any>;
    update(id: string, dto: UpdateServiceReportDto | UpdateMobileServiceReportDto, user?: {
        userId: string;
        role: string;
    }): Promise<{
        before: any;
        after: any;
    }>;
    remove(id: string, user?: {
        userId: string;
        role: string;
    }): Promise<any>;
    generatePdf(id: string, user?: {
        userId: string;
        role: string;
    }): Promise<{
        buffer: Buffer;
        fileName: string;
    }>;
    private getCompanyPdfSettings;
    private invalidateCache;
}
