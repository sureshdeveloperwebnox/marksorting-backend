import { Queue } from 'bullmq';
import { MailService } from '../mail/mail.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { ServiceReportsService } from '../service-reports/service-reports.service';
import { InstallationReportsService } from '../installation-reports/installation-reports.service';
import { PrismaService } from '../../prisma/prisma.service';
export interface ReportDeliveryResult {
    emailSent: boolean;
    whatsappSent: boolean;
    emailError?: string;
    whatsappError?: string;
}
export declare class ReportNotificationsService {
    private prisma;
    private mailService;
    private whatsAppService;
    private serviceReportsService;
    private installationReportsService;
    private readonly mailQueue;
    private readonly logger;
    constructor(prisma: PrismaService, mailService: MailService, whatsAppService: WhatsAppService, serviceReportsService: ServiceReportsService, installationReportsService: InstallationReportsService, mailQueue: Queue);
    sendServiceReport(reportId: string, millName: string, _millEmail: string | null | undefined, _millWhatsappNumber: string): Promise<ReportDeliveryResult>;
    sendInstallationReport(reportId: string, millName: string, _millEmail: string | null | undefined, _millWhatsappNumber: string): Promise<ReportDeliveryResult>;
    private sendEmailWithAttachment;
    private getServiceReportEmailTemplate;
    private getInstallationReportEmailTemplate;
}
