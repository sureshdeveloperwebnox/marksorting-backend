import { Queue } from 'bullmq';
export interface WhatsAppDocumentMessage {
    to: string;
    documentUrl: string;
    fileName: string;
    caption?: string;
}
export interface WhatsAppMessageJob {
    to: string;
    documentUrl: string;
    fileName: string;
    caption?: string;
    reportId?: string;
    reportType?: 'SERVICE' | 'INSTALLATION';
    retryCount?: number;
}
export declare class WhatsAppService {
    private readonly whatsappQueue;
    private readonly logger;
    constructor(whatsappQueue: Queue);
    sendDocument(message: WhatsAppDocumentMessage): Promise<boolean>;
    sendReportPdf(to: string, pdfBuffer: Buffer, fileName: string, reportId: string, reportType: 'SERVICE' | 'INSTALLATION', millName: string, caption?: string): Promise<boolean>;
    private formatPhoneNumber;
    getQueueStats(): Promise<{
        waiting: number;
        active: number;
        completed: number;
        failed: number;
        delayed: number;
        total: number;
    }>;
}
