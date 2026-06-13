import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export interface WhatsAppQueueMessage {
    to: string;
    documentUrl: string;
    fileName: string;
    caption?: string;
    reportId?: string;
    reportType?: 'SERVICE' | 'INSTALLATION';
    retryCount?: number;
}
export declare class WhatsAppRabbitMQService implements OnModuleInit, OnModuleDestroy {
    private configService;
    private readonly logger;
    private connection;
    private channel;
    private readonly QUEUE_NAME;
    private readonly DLQ_NAME;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    private connect;
    private disconnect;
    publishMessage(message: WhatsAppQueueMessage): Promise<boolean>;
    consumeMessages(handler: (message: WhatsAppQueueMessage) => Promise<boolean>): Promise<void>;
    getQueueStats(): Promise<{
        ready: number;
        unacked: number;
        total: number;
    }>;
    isConnected(): boolean;
}
