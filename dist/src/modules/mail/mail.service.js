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
var MailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const config_1 = require("@nestjs/config");
const mail_templates_1 = require("./templates/mail-templates");
let MailService = MailService_1 = class MailService {
    mailQueue;
    configService;
    logger = new common_1.Logger(MailService_1.name);
    constructor(mailQueue, configService) {
        this.mailQueue = mailQueue;
        this.configService = configService;
    }
    async sendMail(to, subject, html) {
        try {
            await this.mailQueue.add('send-mail', { to, subject, html }, {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 5000,
                },
                removeOnComplete: false,
                removeOnFail: false,
            });
            this.logger.log(`Queued email for ${to} successfully.`);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to queue email for ${to}`, error);
            return false;
        }
    }
    async sendPasswordResetMail(to, name, token) {
        const frontendUrl = this.configService.get('app.frontendUrl') || 'http://localhost:3000';
        const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
        const emailHtml = (0, mail_templates_1.getForgotPasswordTemplate)(name, resetUrl, 60, frontendUrl);
        const subject = 'Reset Password - Mark Sorting System';
        return this.sendMail(to, subject, emailHtml);
    }
};
exports.MailService = MailService;
exports.MailService = MailService = MailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, bullmq_1.InjectQueue)('mail')),
    __metadata("design:paramtypes", [bullmq_2.Queue,
        config_1.ConfigService])
], MailService);
//# sourceMappingURL=mail.service.js.map