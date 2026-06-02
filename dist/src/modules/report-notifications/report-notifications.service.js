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
var ReportNotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportNotificationsService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const mail_service_1 = require("../mail/mail.service");
const whatsapp_service_1 = require("../whatsapp/whatsapp.service");
const service_reports_service_1 = require("../service-reports/service-reports.service");
const installation_reports_service_1 = require("../installation-reports/installation-reports.service");
let ReportNotificationsService = ReportNotificationsService_1 = class ReportNotificationsService {
    mailService;
    whatsAppService;
    serviceReportsService;
    installationReportsService;
    mailQueue;
    logger = new common_1.Logger(ReportNotificationsService_1.name);
    constructor(mailService, whatsAppService, serviceReportsService, installationReportsService, mailQueue) {
        this.mailService = mailService;
        this.whatsAppService = whatsAppService;
        this.serviceReportsService = serviceReportsService;
        this.installationReportsService = installationReportsService;
        this.mailQueue = mailQueue;
    }
    async sendServiceReport(reportId, millName, millEmail, millWhatsappNumber) {
        const result = {
            emailSent: false,
            whatsappSent: false,
        };
        try {
            this.logger.log(`Generating PDF for Service Report ${reportId}...`);
            const { buffer: pdfBuffer, fileName } = await this.serviceReportsService.generatePdf(reportId);
            if (millWhatsappNumber) {
                try {
                    result.whatsappSent = await this.whatsAppService.sendReportPdf(millWhatsappNumber, pdfBuffer, fileName, reportId, 'SERVICE', millName);
                    this.logger.log(`WhatsApp queued for Service Report ${reportId} to ${millWhatsappNumber}`);
                }
                catch (error) {
                    result.whatsappError = error instanceof Error ? error.message : 'WhatsApp sending failed';
                    this.logger.error(`WhatsApp failed for Service Report ${reportId}`, error);
                }
            }
            else {
                this.logger.warn(`No WhatsApp number for Service Report ${reportId}`);
            }
            if (millEmail) {
                try {
                    const subject = `${millName} Service Report`;
                    const html = this.getServiceReportEmailTemplate(millName);
                    const base64Content = pdfBuffer.toString('base64');
                    result.emailSent = await this.sendEmailWithAttachment(millEmail, subject, html, fileName, pdfBuffer);
                    this.logger.log(`Email queued for Service Report ${reportId} to ${millEmail}`);
                }
                catch (error) {
                    result.emailError = error instanceof Error ? error.message : 'Email sending failed';
                    this.logger.error(`Email failed for Service Report ${reportId}`, error);
                }
            }
            else {
                this.logger.warn(`No email for Service Report ${reportId}`);
            }
            return result;
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Failed to send Service Report ${reportId}: ${errorMsg}`, error);
            result.emailError = result.emailError || errorMsg;
            result.whatsappError = result.whatsappError || errorMsg;
            return result;
        }
    }
    async sendInstallationReport(reportId, millName, millEmail, millWhatsappNumber) {
        const result = {
            emailSent: false,
            whatsappSent: false,
        };
        try {
            this.logger.log(`Generating PDF for Installation Report ${reportId}...`);
            const { buffer: pdfBuffer, fileName } = await this.installationReportsService.generatePdf(reportId);
            if (millWhatsappNumber) {
                try {
                    result.whatsappSent = await this.whatsAppService.sendReportPdf(millWhatsappNumber, pdfBuffer, fileName, reportId, 'INSTALLATION', millName);
                    this.logger.log(`WhatsApp queued for Installation Report ${reportId} to ${millWhatsappNumber}`);
                }
                catch (error) {
                    result.whatsappError = error instanceof Error ? error.message : 'WhatsApp sending failed';
                    this.logger.error(`WhatsApp failed for Installation Report ${reportId}`, error);
                }
            }
            else {
                this.logger.warn(`No WhatsApp number for Installation Report ${reportId}`);
            }
            if (millEmail) {
                try {
                    const subject = `${millName} Installation Report`;
                    const html = this.getInstallationReportEmailTemplate(millName);
                    result.emailSent = await this.sendEmailWithAttachment(millEmail, subject, html, fileName, pdfBuffer);
                    this.logger.log(`Email queued for Installation Report ${reportId} to ${millEmail}`);
                }
                catch (error) {
                    result.emailError = error instanceof Error ? error.message : 'Email sending failed';
                    this.logger.error(`Email failed for Installation Report ${reportId}`, error);
                }
            }
            else {
                this.logger.warn(`No email for Installation Report ${reportId}`);
            }
            return result;
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Failed to send Installation Report ${reportId}: ${errorMsg}`, error);
            result.emailError = result.emailError || errorMsg;
            result.whatsappError = result.whatsappError || errorMsg;
            return result;
        }
    }
    async sendEmailWithAttachment(to, subject, html, fileName, pdfBuffer) {
        try {
            await this.mailQueue.add('send-mail-with-attachment', {
                to,
                subject,
                html,
                attachments: [
                    {
                        filename: fileName,
                        content: pdfBuffer.toString('base64'),
                        encoding: 'base64',
                        contentType: 'application/pdf',
                    },
                ],
            }, {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 5000,
                },
                removeOnComplete: false,
                removeOnFail: false,
            });
            return true;
        }
        catch (error) {
            throw error;
        }
    }
    getServiceReportEmailTemplate(millName) {
        return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f4f4f4; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .footer { background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Service Report</h2>
    </div>
    <div class="content">
      <p>Dear ${millName},</p>
      <p>Please find attachment.</p>
      <p>Thank you for choosing our services.</p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
    }
    getInstallationReportEmailTemplate(millName) {
        return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f4f4f4; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .footer { background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Installation Report</h2>
    </div>
    <div class="content">
      <p>Dear ${millName},</p>
      <p>Please find attachment.</p>
      <p>Thank you for choosing our services.</p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
    }
};
exports.ReportNotificationsService = ReportNotificationsService;
exports.ReportNotificationsService = ReportNotificationsService = ReportNotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(4, (0, bullmq_1.InjectQueue)('mail')),
    __metadata("design:paramtypes", [mail_service_1.MailService,
        whatsapp_service_1.WhatsAppService,
        service_reports_service_1.ServiceReportsService,
        installation_reports_service_1.InstallationReportsService,
        bullmq_2.Queue])
], ReportNotificationsService);
//# sourceMappingURL=report-notifications.service.js.map