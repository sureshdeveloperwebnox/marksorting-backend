"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var WhatsAppRabbitMQProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppRabbitMQProcessor = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const rxjs_1 = require("rxjs");
const whatsapp_rabbitmq_service_1 = require("./whatsapp-rabbitmq.service");
let WhatsAppRabbitMQProcessor = WhatsAppRabbitMQProcessor_1 = class WhatsAppRabbitMQProcessor {
    rabbitMQService;
    httpService;
    configService;
    logger = new common_1.Logger(WhatsAppRabbitMQProcessor_1.name);
    ultramsgApiUrl;
    ultramsgToken;
    ultramsgInstance;
    constructor(rabbitMQService, httpService, configService) {
        this.rabbitMQService = rabbitMQService;
        this.httpService = httpService;
        this.configService = configService;
        this.ultramsgApiUrl = this.configService.get('ULTRAMSG_API_URL', 'https://api.ultramsg.com');
        this.ultramsgToken = this.configService.get('ULTRAMSG_TOKEN', '');
        this.ultramsgInstance = this.configService.get('ULTRAMSG_INSTANCE', '');
    }
    async onModuleInit() {
        await this.delay(3000);
        await this.startConsuming();
    }
    async startConsuming() {
        this.logger.log('Starting WhatsApp RabbitMQ consumer...');
        await this.rabbitMQService.consumeMessages(async (message) => {
            return this.processMessage(message);
        });
    }
    async processMessage(message) {
        try {
            this.logger.log(`Sending WhatsApp document to ${message.to}`);
            await this.delay(2000);
            if (message.reportId && message.reportType) {
                await this.sendDocument(message.to, message.documentUrl, message.fileName, message.caption);
            }
            else {
                await this.sendDocument(message.to, message.documentUrl, message.fileName, message.caption);
            }
            this.logger.log(`WhatsApp message sent successfully to ${message.to}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to send WhatsApp to ${message.to} (attempt ${(message.retryCount || 0) + 1})`, error);
            return false;
        }
    }
    async sendDocument(to, documentUrl, fileName, caption) {
        const url = `${this.ultramsgApiUrl}/${this.ultramsgInstance}/messages/document`;
        const payload = {
            token: this.ultramsgToken,
            to: this.formatPhoneNumber(to),
            document: documentUrl,
            filename: fileName,
            caption: caption || '',
        };
        try {
            const response = await (0, rxjs_1.lastValueFrom)(this.httpService.post(url, payload, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            }));
            if (response.data?.error) {
                throw new Error(response.data.error);
            }
            this.logger.log(`Document sent successfully to ${to}`);
        }
        catch (error) {
            throw new Error(`Ultramsg API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    formatPhoneNumber(phone) {
        let cleaned = phone.replace(/\D/g, '');
        cleaned = cleaned.replace(/^0+/, '');
        if (cleaned.length === 10) {
            cleaned = '91' + cleaned;
        }
        if (!cleaned.startsWith('+')) {
            cleaned = '+' + cleaned;
        }
        return cleaned;
    }
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
};
exports.WhatsAppRabbitMQProcessor = WhatsAppRabbitMQProcessor;
exports.WhatsAppRabbitMQProcessor = WhatsAppRabbitMQProcessor = WhatsAppRabbitMQProcessor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [whatsapp_rabbitmq_service_1.WhatsAppRabbitMQService,
        axios_1.HttpService,
        config_1.ConfigService])
], WhatsAppRabbitMQProcessor);
//# sourceMappingURL=whatsapp-rabbitmq.processor.js.map