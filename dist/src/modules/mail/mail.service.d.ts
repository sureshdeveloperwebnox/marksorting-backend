import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
export declare class MailService {
    private readonly mailQueue;
    private readonly configService;
    private readonly logger;
    constructor(mailQueue: Queue, configService: ConfigService);
    sendMail(to: string, subject: string, html: string): Promise<boolean>;
    sendPasswordResetMail(to: string, name: string, token: string): Promise<boolean>;
}
