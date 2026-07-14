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
const prisma_service_1 = require("../../prisma/prisma.service");
let ReportNotificationsService = ReportNotificationsService_1 = class ReportNotificationsService {
    prisma;
    mailService;
    whatsAppService;
    serviceReportsService;
    installationReportsService;
    mailQueue;
    logger = new common_1.Logger(ReportNotificationsService_1.name);
    constructor(prisma, mailService, whatsAppService, serviceReportsService, installationReportsService, mailQueue) {
        this.prisma = prisma;
        this.mailService = mailService;
        this.whatsAppService = whatsAppService;
        this.serviceReportsService = serviceReportsService;
        this.installationReportsService = installationReportsService;
        this.mailQueue = mailQueue;
    }
    async sendServiceReport(reportId, millName, _millEmail, _millWhatsappNumber, _authorizedPersonPhone) {
        const result = {
            emailSent: false,
            whatsappSent: false,
        };
        try {
            const report = await this.prisma.serviceReport.findUnique({
                where: { id: reportId },
                include: {
                    mill: { select: { name: true } },
                    technicians: {
                        include: {
                            technician: true,
                        },
                    },
                },
            });
            if (!report) {
                throw new Error(`Service Report ${reportId} not found`);
            }
            const activeMillName = report.mill?.name || millName || 'Unknown Mill';
            this.logger.debug(`Original mill details: email=${_millEmail || 'none'}, whatsapp=${_millWhatsappNumber || 'none'}`);
            this.logger.log(`Generating PDF for Service Report ${reportId}...`);
            const { buffer: pdfBuffer, fileName } = await this.serviceReportsService.generatePdf(reportId);
            const assignedTechnicians = report.technicians
                .map((t) => t.technician)
                .filter(Boolean);
            if (assignedTechnicians.length === 0) {
                this.logger.warn(`No assigned technicians for Service Report ${reportId}`);
                return result;
            }
            const formattedDate = report.visit_date
                ? new Date(report.visit_date).toLocaleDateString('en-GB')
                : '—';
            const caption = `*Service Report Created*\n\n` +
                `*Report No:* ${report.report_number || '—'}\n` +
                `*Mill Name:* ${activeMillName}\n` +
                `*Place:* ${report.place || '—'}\n` +
                `*Date:* ${formattedDate}\n` +
                `*Model:* ${report.machine_model || '—'}\n` +
                `*Serial/Frame No:* ${report.serial_or_frame_no || '—'}\n` +
                `*Authorized Person:* ${report.authorized_person || '—'}\n\n` +
                `Please find the attached Service Report PDF.`;
            for (const technician of assignedTechnicians) {
                const techEmail = technician.email;
                const techPhone = technician.phone;
                this.logger.log(`Sending Service Report ${reportId} notification to engineer ${technician.full_name} (Email: ${techEmail}, Phone: ${techPhone})`);
                if (techPhone) {
                    try {
                        const sent = await this.whatsAppService.sendReportPdf(techPhone, pdfBuffer, fileName, reportId, 'SERVICE', activeMillName, caption);
                        if (sent)
                            result.whatsappSent = true;
                        this.logger.log(`WhatsApp queued for Service Report ${reportId} to technician ${technician.full_name} (${techPhone})`);
                    }
                    catch (error) {
                        result.whatsappError =
                            error instanceof Error
                                ? error.message
                                : 'WhatsApp sending failed';
                        this.logger.error(`WhatsApp failed for Service Report ${reportId} to technician ${technician.full_name}`, error);
                    }
                }
                if (techEmail) {
                    try {
                        const subject = `${activeMillName} Service Report`;
                        const html = this.getServiceReportEmailTemplate(activeMillName);
                        const sent = await this.sendEmailWithAttachment(techEmail, subject, html, fileName, pdfBuffer);
                        if (sent)
                            result.emailSent = true;
                        this.logger.log(`Email queued for Service Report ${reportId} to technician ${technician.full_name} (${techEmail})`);
                    }
                    catch (error) {
                        result.emailError =
                            error instanceof Error ? error.message : 'Email sending failed';
                        this.logger.error(`Email failed for Service Report ${reportId} to technician ${technician.full_name}`, error);
                    }
                }
            }
            if (_authorizedPersonPhone) {
                try {
                    this.logger.log(`Sending Service Report ${reportId} WhatsApp to authorized person (${_authorizedPersonPhone})`);
                    const sent = await this.whatsAppService.sendReportPdf(_authorizedPersonPhone, pdfBuffer, fileName, reportId, 'SERVICE', activeMillName, caption);
                    if (sent)
                        result.whatsappSent = true;
                    this.logger.log(`WhatsApp queued for Service Report ${reportId} to authorized person (${_authorizedPersonPhone})`);
                }
                catch (error) {
                    result.whatsappError =
                        error instanceof Error
                            ? error.message
                            : 'WhatsApp sending failed';
                    this.logger.error(`WhatsApp failed for Service Report ${reportId} to authorized person`, error);
                }
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
    async sendInstallationReport(reportId, millName, _millEmail, _millWhatsappNumber, _authorizedPersonPhone) {
        const result = {
            emailSent: false,
            whatsappSent: false,
        };
        try {
            const report = await this.prisma.installationReport.findUnique({
                where: { id: reportId },
                include: {
                    mill: { select: { name: true } },
                    technicians: {
                        include: {
                            technician: true,
                        },
                    },
                },
            });
            if (!report) {
                throw new Error(`Installation Report ${reportId} not found`);
            }
            const activeMillName = report.mill?.name || millName || 'Unknown Mill';
            this.logger.debug(`Original mill details: email=${_millEmail || 'none'}, whatsapp=${_millWhatsappNumber || 'none'}`);
            this.logger.log(`Generating PDF for Installation Report ${reportId}...`);
            const { buffer: pdfBuffer, fileName } = await this.installationReportsService.generatePdf(reportId);
            const assignedTechnicians = report.technicians
                .map((t) => t.technician)
                .filter(Boolean);
            if (assignedTechnicians.length === 0) {
                this.logger.warn(`No assigned technicians for Installation Report ${reportId}`);
                return result;
            }
            const formattedDate = report.visit_date
                ? new Date(report.visit_date).toLocaleDateString('en-GB')
                : '—';
            const caption = `*Installation Report Created*\n\n` +
                `*Report No:* ${report.report_number || '—'}\n` +
                `*Mill Name:* ${activeMillName}\n` +
                `*Place:* ${report.place || '—'}\n` +
                `*Date:* ${formattedDate}\n` +
                `*Model:* ${report.machine_model || '—'}\n` +
                `*Serial/Frame No:* ${report.serial_or_frame_no || '—'}\n` +
                `*Authorized Person:* ${report.authorized_person || '—'}\n\n` +
                `Please find the attached Installation Report PDF.`;
            for (const technician of assignedTechnicians) {
                const techEmail = technician.email;
                const techPhone = technician.phone;
                this.logger.log(`Sending Installation Report ${reportId} notification to engineer ${technician.full_name} (Email: ${techEmail}, Phone: ${techPhone})`);
                if (techPhone) {
                    try {
                        const sent = await this.whatsAppService.sendReportPdf(techPhone, pdfBuffer, fileName, reportId, 'INSTALLATION', activeMillName, caption);
                        if (sent)
                            result.whatsappSent = true;
                        this.logger.log(`WhatsApp queued for Installation Report ${reportId} to technician ${technician.full_name} (${techPhone})`);
                    }
                    catch (error) {
                        result.whatsappError =
                            error instanceof Error
                                ? error.message
                                : 'WhatsApp sending failed';
                        this.logger.error(`WhatsApp failed for Installation Report ${reportId} to technician ${technician.full_name}`, error);
                    }
                }
                if (techEmail) {
                    try {
                        const subject = `${activeMillName} Installation Report`;
                        const html = this.getInstallationReportEmailTemplate(activeMillName);
                        const sent = await this.sendEmailWithAttachment(techEmail, subject, html, fileName, pdfBuffer);
                        if (sent)
                            result.emailSent = true;
                        this.logger.log(`Email queued for Installation Report ${reportId} to technician ${technician.full_name} (${techEmail})`);
                    }
                    catch (error) {
                        result.emailError =
                            error instanceof Error ? error.message : 'Email sending failed';
                        this.logger.error(`Email failed for Installation Report ${reportId} to technician ${technician.full_name}`, error);
                    }
                }
            }
            if (_authorizedPersonPhone) {
                try {
                    this.logger.log(`Sending Installation Report ${reportId} WhatsApp to authorized person (${_authorizedPersonPhone})`);
                    const sent = await this.whatsAppService.sendReportPdf(_authorizedPersonPhone, pdfBuffer, fileName, reportId, 'INSTALLATION', activeMillName, caption);
                    if (sent)
                        result.whatsappSent = true;
                    this.logger.log(`WhatsApp queued for Installation Report ${reportId} to authorized person (${_authorizedPersonPhone})`);
                }
                catch (error) {
                    result.whatsappError =
                        error instanceof Error
                            ? error.message
                            : 'WhatsApp sending failed';
                    this.logger.error(`WhatsApp failed for Installation Report ${reportId} to authorized person`, error);
                }
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
    __param(5, (0, bullmq_1.InjectQueue)('mail')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        mail_service_1.MailService,
        whatsapp_service_1.WhatsAppService,
        service_reports_service_1.ServiceReportsService,
        installation_reports_service_1.InstallationReportsService,
        bullmq_2.Queue])
], ReportNotificationsService);
//# sourceMappingURL=report-notifications.service.js.map