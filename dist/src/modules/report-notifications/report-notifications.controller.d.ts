import { EventEmitter2 } from '@nestjs/event-emitter';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
declare class SendPdfDto {
    millWhatsappNumber?: string;
    millEmail?: string;
}
export declare class ReportNotificationsController {
    private eventEmitter;
    private whatsAppService;
    private readonly logger;
    constructor(eventEmitter: EventEmitter2, whatsAppService: WhatsAppService);
    sendServiceReportPdf(reportId: string, dto: SendPdfDto, req: any): Promise<{
        success: boolean;
        message: string;
        reportId: string;
    }>;
    sendInstallationReportPdf(reportId: string, dto: SendPdfDto, req: any): Promise<{
        success: boolean;
        message: string;
        reportId: string;
    }>;
    getWhatsAppQueueStats(): Promise<{
        success: boolean;
        data: {
            waiting: number;
            active: number;
            completed: number;
            failed: number;
            delayed: number;
            total: number;
        };
    }>;
}
export {};
