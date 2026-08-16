import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { WhatsAppMessageJob } from './whatsapp.service';
import { PrismaService } from '../../prisma/prisma.service';
export declare class WhatsAppProcessor extends WorkerHost {
    private configService;
    private httpService;
    private prisma;
    private readonly logger;
    private readonly isMockMode;
    private readonly apiToken;
    private readonly instanceId;
    private readonly baseUrl;
    constructor(configService: ConfigService, httpService: HttpService, prisma: PrismaService);
    process(job: Job<WhatsAppMessageJob>): Promise<void>;
    private handleSendDocument;
    private handleSendReportPdf;
    private sendDocumentViaUltramsg;
    private logNotificationAttempt;
}
