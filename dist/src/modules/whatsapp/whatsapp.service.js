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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var WhatsAppService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
let WhatsAppService = WhatsAppService_1 = class WhatsAppService {
    whatsappQueue;
    logger = new common_1.Logger(WhatsAppService_1.name);
    constructor(whatsappQueue) {
        this.whatsappQueue = whatsappQueue;
    }
    async sendDocument(message) {
        try {
            const jobData = {
                to: this.formatPhoneNumber(message.to),
                documentUrl: message.documentUrl,
                fileName: message.fileName,
                caption: message.caption || '',
                retryCount: 0,
            };
            await this.whatsappQueue.add('send-document', jobData, {
                attempts: 5,
                backoff: {
                    type: 'exponential',
                    delay: 10000,
                },
                removeOnComplete: {
                    age: 86400,
                    count: 1000,
                },
                removeOnFail: {
                    age: 604800,
                    count: 500,
                },
                delay: 0,
            });
            this.logger.log(`Queued WhatsApp document to ${jobData.to}: ${message.fileName}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to queue WhatsApp message to ${message.to}`, error);
            return false;
        }
    }
    async sendReportPdf(to, pdfBuffer, fileName, reportId, reportType, millName, caption) {
        try {
            const base64Data = pdfBuffer.toString('base64');
            const dataUrl = `data:application/pdf;base64,${base64Data}`;
            const jobData = {
                to: this.formatPhoneNumber(to),
                documentUrl: dataUrl,
                fileName,
                caption: caption || '',
                reportId,
                reportType,
                retryCount: 0,
            };
            await this.whatsappQueue.add('send-report-pdf', jobData, {
                attempts: 5,
                backoff: {
                    type: 'exponential',
                    delay: 10000,
                },
                removeOnComplete: {
                    age: 86400,
                    count: 1000,
                },
                removeOnFail: {
                    age: 604800,
                    count: 500,
                },
            });
            this.logger.log(`Queued ${reportType} report PDF to ${jobData.to} for mill: ${millName}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to queue ${reportType} report PDF to ${to}`, error);
            return false;
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
    async getQueueStats() {
        const [waiting, active, completed, failed, delayed] = await Promise.all([
            this.whatsappQueue.getWaitingCount(),
            this.whatsappQueue.getActiveCount(),
            this.whatsappQueue.getCompletedCount(),
            this.whatsappQueue.getFailedCount(),
            this.whatsappQueue.getDelayedCount(),
        ]);
        return {
            waiting,
            active,
            completed,
            failed,
            delayed,
            total: waiting + active + delayed,
        };
    }
};
exports.WhatsAppService = WhatsAppService;
exports.WhatsAppService = WhatsAppService = WhatsAppService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, bullmq_1.InjectQueue)('whatsapp')),
    __metadata("design:paramtypes", [bullmq_2.Queue])
], WhatsAppService);
//# sourceMappingURL=whatsapp.service.js.map