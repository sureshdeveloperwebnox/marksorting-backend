import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { SettingsService } from '../settings/settings.service';
import { PdfService } from '../pdf/pdf.service';
import { DocumentTemplateService } from '../pdf/templates/document-template.service';
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
}
interface UserSessionPayload {
    userId: string;
    role: string;
}
export declare class ReportsService {
    private prisma;
    private redis;
    private settingsService;
    private pdfService;
    private documentTemplateService;
    private readonly CACHE_PREFIX;
    constructor(prisma: PrismaService, redis: RedisService, settingsService: SettingsService, pdfService: PdfService, documentTemplateService: DocumentTemplateService);
    private getServicesWhereClause;
    getServices(params: ReportParams, user: UserSessionPayload): Promise<any>;
    exportServices(params: ReportParams, user: UserSessionPayload, formatType: 'pdf' | 'csv' | 'excel'): Promise<{
        buffer: Buffer<ArrayBufferLike>;
        fileName: string;
        contentType: string;
    }>;
    private getInstallationsWhereClause;
    getInstallations(params: ReportParams, user: UserSessionPayload): Promise<any>;
    exportInstallations(params: ReportParams, user: UserSessionPayload, formatType: 'pdf' | 'csv' | 'excel'): Promise<{
        buffer: Buffer<ArrayBufferLike>;
        fileName: string;
        contentType: string;
    }>;
    private getExpensesWhereClause;
    getExpenses(params: ReportParams, user: UserSessionPayload): Promise<any>;
    exportExpenses(params: ReportParams, user: UserSessionPayload, formatType: 'pdf' | 'csv' | 'excel'): Promise<{
        buffer: Buffer<ArrayBufferLike>;
        fileName: string;
        contentType: string;
    }>;
    private getMasterMillsWhereClause;
    getMasterMills(params: ReportParams, user: UserSessionPayload): Promise<any>;
    exportMasterMills(params: ReportParams, user: UserSessionPayload, formatType: 'pdf' | 'csv' | 'excel'): Promise<{
        buffer: Buffer<ArrayBufferLike>;
        fileName: string;
        contentType: string;
    }>;
    private generateCsv;
    private generateExcel;
    private getFiltersSummary;
    private getCompanyPdfSettings;
    invalidateCache(): Promise<void>;
}
export {};
