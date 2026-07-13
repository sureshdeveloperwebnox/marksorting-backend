import { ReportNotificationsService } from './report-notifications.service';
import { PrismaService } from '../../prisma/prisma.service';
export declare class ReportNotificationsEventListener {
    private reportNotificationsService;
    private prisma;
    private readonly logger;
    constructor(reportNotificationsService: ReportNotificationsService, prisma: PrismaService);
    onServiceReportCreatedForPdf(payload: {
        reportId: string;
        reportNumber: string;
        millId: string;
        millName: string;
        millWhatsappNumber?: string;
        millEmail?: string;
        authorizedPersonPhone?: string;
    }): Promise<void>;
    onInstallationReportCreatedForPdf(payload: {
        reportId: string;
        reportNumber: string;
        millId: string;
        millName: string;
        millWhatsappNumber?: string;
        millEmail?: string;
        authorizedPersonPhone?: string;
    }): Promise<void>;
    onServiceReportSendPdf(payload: {
        reportId: string;
        triggeredBy: string;
    }): Promise<void>;
    onInstallationReportSendPdf(payload: {
        reportId: string;
        triggeredBy: string;
    }): Promise<void>;
}
