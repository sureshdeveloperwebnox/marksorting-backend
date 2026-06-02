"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MailProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = __importStar(require("nodemailer"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
let MailProcessor = MailProcessor_1 = class MailProcessor extends bullmq_1.WorkerHost {
    configService;
    logger = new common_1.Logger(MailProcessor_1.name);
    transporter = null;
    isMockMode = false;
    constructor(configService) {
        super();
        this.configService = configService;
        this.initTransporter();
    }
    initTransporter() {
        const host = this.configService.get('mail.host');
        const port = this.configService.get('mail.port');
        const user = this.configService.get('mail.user');
        const pass = this.configService.get('mail.pass');
        if (!user || !pass) {
            this.logger.warn('SMTP credentials not fully provided. Running Mail Service in MOCK MODE (logging emails to console).');
            this.isMockMode = true;
            return;
        }
        try {
            this.transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user,
                    pass,
                },
            });
            this.logger.log('Nodemailer SMTP Transporter initialized successfully.');
        }
        catch (error) {
            this.logger.error('Failed to initialize Nodemailer SMTP Transporter. Falling back to Mock Mode.', error);
            this.isMockMode = true;
        }
    }
    async process(job) {
        if (job.name === 'send-mail') {
            await this.handleSendMail(job);
        }
        else if (job.name === 'send-mail-with-attachment') {
            await this.handleSendMailWithAttachment(job);
        }
    }
    async handleSendMail(job) {
        const { to, subject, html } = job.data;
        const fromName = this.configService.get('mail.fromName') || 'Mark Sorting System';
        const fromUser = this.configService.get('mail.user') || 'no-reply@marksorting.com';
        if (this.isMockMode || !this.transporter) {
            this.logger.log(`[Mock Email] Sending Email:\n` +
                `  To: ${to}\n` +
                `  From: "${fromName}" <${fromUser}>\n` +
                `  Subject: ${subject}\n` +
                `  HTML Length: ${html?.length || 0} characters`);
            return;
        }
        try {
            let logoPath = path.join(__dirname, 'assets', 'logo.png');
            if (!fs.existsSync(logoPath)) {
                logoPath = path.join(process.cwd(), 'src', 'modules', 'mail', 'assets', 'logo.png');
            }
            const attachments = [];
            if (fs.existsSync(logoPath)) {
                attachments.push({
                    filename: 'logo.png',
                    path: logoPath,
                    cid: 'logo',
                });
            }
            else {
                this.logger.warn(`Logo image not found at ${logoPath}. Sending email without logo attachment.`);
            }
            const info = await this.transporter.sendMail({
                from: `"${fromName}" <${fromUser}>`,
                to,
                subject,
                html,
                attachments,
            });
            this.logger.log(`Email successfully sent to ${to}. MessageId: ${info.messageId}`);
        }
        catch (error) {
            this.logger.error(`Failed to send email to ${to} for job ${job.id}`, error);
            throw error;
        }
    }
    async handleSendMailWithAttachment(job) {
        const { to, subject, html, attachments } = job.data;
        const fromName = this.configService.get('mail.fromName') || 'Mark Sorting System';
        const fromUser = this.configService.get('mail.user') || 'no-reply@marksorting.com';
        if (this.isMockMode || !this.transporter) {
            this.logger.log(`[Mock Email with Attachment] Sending Email:\n` +
                `  To: ${to}\n` +
                `  From: "${fromName}" <${fromUser}>\n` +
                `  Subject: ${subject}\n` +
                `  HTML Length: ${html?.length || 0} characters\n` +
                `  Attachments: ${attachments?.length || 0} files`);
            return;
        }
        try {
            let logoPath = path.join(__dirname, 'assets', 'logo.png');
            if (!fs.existsSync(logoPath)) {
                logoPath = path.join(process.cwd(), 'src', 'modules', 'mail', 'assets', 'logo.png');
            }
            const emailAttachments = [];
            if (fs.existsSync(logoPath)) {
                emailAttachments.push({
                    filename: 'logo.png',
                    path: logoPath,
                    cid: 'logo',
                });
            }
            if (attachments && Array.isArray(attachments)) {
                for (const attachment of attachments) {
                    emailAttachments.push({
                        filename: attachment.filename,
                        content: Buffer.from(attachment.content, attachment.encoding || 'base64'),
                        contentType: attachment.contentType || 'application/octet-stream',
                    });
                }
            }
            const info = await this.transporter.sendMail({
                from: `"${fromName}" <${fromUser}>`,
                to,
                subject,
                html,
                attachments: emailAttachments,
            });
            this.logger.log(`Email with attachment successfully sent to ${to}. MessageId: ${info.messageId}`);
        }
        catch (error) {
            this.logger.error(`Failed to send email with attachment to ${to} for job ${job.id}`, error);
            throw error;
        }
    }
};
exports.MailProcessor = MailProcessor;
exports.MailProcessor = MailProcessor = MailProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('mail'),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MailProcessor);
//# sourceMappingURL=mail.processor.js.map