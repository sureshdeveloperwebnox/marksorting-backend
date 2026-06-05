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
var WhatsAppProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const prisma_service_1 = require("../../prisma/prisma.service");
let WhatsAppProcessor = WhatsAppProcessor_1 = class WhatsAppProcessor extends bullmq_1.WorkerHost {
    configService;
    httpService;
    prisma;
    logger = new common_1.Logger(WhatsAppProcessor_1.name);
    isMockMode;
    apiToken;
    instanceId;
    baseUrl;
    constructor(configService, httpService, prisma) {
        super();
        this.configService = configService;
        this.httpService = httpService;
        this.prisma = prisma;
        this.apiToken = this.configService.get('whatsapp.apiToken') || '';
        this.instanceId = this.configService.get('whatsapp.instanceId') || '';
        this.baseUrl = this.configService.get('whatsapp.baseUrl') || 'https://api.ultramsg.com';
        this.isMockMode = !this.apiToken || !this.instanceId;
        if (this.isMockMode) {
            this.logger.warn('WhatsApp credentials not configured. Running in MOCK MODE.');
        }
        else {
            this.logger.log(`WhatsApp processor initialized for instance: ${this.instanceId}`);
        }
    }
    async process(job) {
        switch (job.name) {
            case 'send-document':
                await this.handleSendDocument(job);
                break;
            case 'send-report-pdf':
                await this.handleSendReportPdf(job);
                break;
            default:
                this.logger.warn(`Unknown job type: ${job.name}`);
        }
    }
    async handleSendDocument(job) {
        const { to, documentUrl, fileName, caption } = job.data;
        if (this.isMockMode) {
            this.logger.log(`[Mock WhatsApp] Would send document:\n` +
                `  To: ${to}\n` +
                `  File: ${fileName}\n` +
                `  Caption: ${caption || '(none)'}`);
            return;
        }
        if (!to) {
            throw new Error('Recipient phone number (to) is required');
        }
        const phoneNumber = to;
        const docCaption = caption || '';
        await this.sendDocumentViaUltramsg(phoneNumber, documentUrl, fileName || '', docCaption, job);
    }
    async handleSendReportPdf(job) {
        const { to, documentUrl, fileName, reportId, reportType } = job.data;
        if (this.isMockMode) {
            this.logger.log(`[Mock WhatsApp] Would send ${reportType} report PDF:\n` +
                `  To: ${to}\n` +
                `  File: ${fileName}\n` +
                `  Report ID: ${reportId}`);
            await this.logNotificationAttempt(reportId || '', reportType || 'SERVICE', to || '', 'FAILED', 'Mock mode - not sent');
            return;
        }
        if (!to) {
            throw new Error('Recipient phone number (to) is required');
        }
        const phoneNumber = to;
        const docName = fileName || '';
        const docUrl = documentUrl || '';
        try {
            await this.sendDocumentViaUltramsg(phoneNumber, docUrl, docName, '', job);
            if (reportId) {
                await this.logNotificationAttempt(reportId, reportType || 'SERVICE', phoneNumber, 'SENT');
            }
            this.logger.log(`Successfully sent ${reportType} report PDF to ${phoneNumber}`);
        }
        catch (error) {
            if (reportId) {
                await this.logNotificationAttempt(reportId, reportType || 'SERVICE', phoneNumber, 'FAILED', error instanceof Error ? error.message : 'Unknown error');
            }
            throw error;
        }
    }
    async sendDocumentViaUltramsg(to, documentUrl, fileName, caption, job) {
        const apiUrl = `${this.baseUrl}/${this.instanceId}/messages/document`;
        const payload = {
            token: this.apiToken,
            to: to.replace('+', ''),
            filename: fileName,
            document: documentUrl,
            caption: caption || undefined,
        };
        try {
            const response = await (0, rxjs_1.lastValueFrom)(this.httpService.post(apiUrl, payload, {
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 30000,
            }));
            const responseData = response.data;
            if (responseData.error) {
                throw new Error(`Ultramsg API error: ${responseData.error}`);
            }
            this.logger.log(`WhatsApp document sent successfully to ${to}. ` +
                `Message ID: ${responseData.id || 'N/A'}`);
            return responseData;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Failed to send WhatsApp document to ${to} (Attempt ${job.attemptsMade + 1}/${job.opts.attempts}): ${errorMessage}`, error);
            throw error;
        }
    }
    async logNotificationAttempt(reportId, reportType, recipientPhone, status, errorMessage) {
        try {
            await this.prisma.notificationLog.create({
                data: {
                    notification_type: 'WHATSAPP',
                    channel: reportType === 'SERVICE' ? 'Service Report' : 'Installation Report',
                    status,
                    provider: 'Ultramsg',
                    provider_message_id: reportId,
                    error_message: errorMessage,
                    sent_at: status === 'SENT' ? new Date() : undefined,
                },
            });
        }
        catch (logError) {
            this.logger.error('Failed to log notification attempt', logError);
        }
    }
};
exports.WhatsAppProcessor = WhatsAppProcessor;
exports.WhatsAppProcessor = WhatsAppProcessor = WhatsAppProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('whatsapp', {
        concurrency: 2,
        limiter: {
            max: 30,
            duration: 60000,
        },
    }),
    __metadata("design:paramtypes", [config_1.ConfigService,
        axios_1.HttpService,
        prisma_service_1.PrismaService])
], WhatsAppProcessor);
//# sourceMappingURL=whatsapp.processor.js.map