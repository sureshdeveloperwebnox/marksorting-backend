import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
export declare class MailProcessor extends WorkerHost {
    private configService;
    private readonly logger;
    private transporter;
    private isMockMode;
    constructor(configService: ConfigService);
    private initTransporter;
    process(job: Job<any>): Promise<void>;
    private handleSendMail;
    private handleSendMailWithAttachment;
}
