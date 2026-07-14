import { OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { WhatsAppRabbitMQService } from './whatsapp-rabbitmq.service';
export declare class WhatsAppRabbitMQProcessor implements OnModuleInit {
    private readonly rabbitMQService;
    private readonly httpService;
    private readonly configService;
    private readonly logger;
    private ultramsgApiUrl;
    private ultramsgToken;
    private ultramsgInstance;
    constructor(rabbitMQService: WhatsAppRabbitMQService, httpService: HttpService, configService: ConfigService);
    onModuleInit(): Promise<void>;
    private startConsuming;
    private processMessage;
    private sendDocument;
    private formatPhoneNumber;
    private delay;
}
