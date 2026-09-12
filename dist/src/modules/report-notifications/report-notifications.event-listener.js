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
var ReportNotificationsEventListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportNotificationsEventListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const report_notifications_service_1 = require("./report-notifications.service");
const prisma_service_1 = require("../../prisma/prisma.service");
let ReportNotificationsEventListener = ReportNotificationsEventListener_1 = class ReportNotificationsEventListener {
    reportNotificationsService;
    prisma;
    logger = new common_1.Logger(ReportNotificationsEventListener_1.name);
    constructor(reportNotificationsService, prisma) {
        this.reportNotificationsService = reportNotificationsService;
        this.prisma = prisma;
    }
    async onServiceReportCreatedForPdf(payload) {
        try {
            const { reportId, reportNumber, millId, millName, millWhatsappNumber, millEmail, authorizedPersonPhone, } = payload;
            this.logger.log(`Processing service-report.created.send-pdf event for report ${reportNumber}`);
            let whatsappNumber = millWhatsappNumber;
            let email = millEmail;
            let authPersonPhone = authorizedPersonPhone;
            if (!whatsappNumber || !email || !authPersonPhone) {
                const report = await this.prisma.serviceReport.findUnique({
                    where: { id: reportId },
                    select: {
                        mill_whatsapp_number: true,
                        mill_email: true,
                        authorized_person_phone: true,
                    },
                });
                if (report) {
                    whatsappNumber =
                        whatsappNumber || report.mill_whatsapp_number || undefined;
                    email = email || report.mill_email || undefined;
                    authPersonPhone =
                        authPersonPhone || report.authorized_person_phone || undefined;
                }
            }
            if (!whatsappNumber && !email && !authPersonPhone) {
                this.logger.warn(`No contact information available for Service Report ${reportNumber}. Skipping PDF delivery.`);
                return;
            }
            const result = await this.reportNotificationsService.sendServiceReport(reportId, millName, email, whatsappNumber || '', authPersonPhone || '');
            if (result.whatsappSent || result.emailSent) {
                this.logger.log(`Service Report ${reportNumber} PDF delivery initiated. ` +
                    `WhatsApp: ${result.whatsappSent}, Email: ${result.emailSent}`);
            }
            else {
                this.logger.error(`Failed to deliver Service Report ${reportNumber} PDF. ` +
                    `WhatsApp Error: ${result.whatsappError || 'N/A'}, ` +
                    `Email Error: ${result.emailError || 'N/A'}`);
            }
        }
        catch (error) {
            this.logger.error('Error handling service-report.created.send-pdf event', error);
        }
    }
    async onInstallationReportCreatedForPdf(payload) {
        try {
            const { reportId, reportNumber, millId, millName, millWhatsappNumber, millEmail, authorizedPersonPhone, } = payload;
            this.logger.log(`Processing installation-report.created.send-pdf event for report ${reportNumber}`);
            let whatsappNumber = millWhatsappNumber;
            let email = millEmail;
            let authPersonPhone = authorizedPersonPhone;
            if (!whatsappNumber || !email || !authPersonPhone) {
                const report = await this.prisma.installationReport.findUnique({
                    where: { id: reportId },
                    select: {
                        mill_whatsapp_number: true,
                        mill_email: true,
                        authorized_person_phone: true,
                    },
                });
                if (report) {
                    whatsappNumber =
                        whatsappNumber || report.mill_whatsapp_number || undefined;
                    email = email || report.mill_email || undefined;
                    authPersonPhone =
                        authPersonPhone || report.authorized_person_phone || undefined;
                }
            }
            if (!whatsappNumber && !email && !authPersonPhone) {
                this.logger.warn(`No contact information available for Installation Report ${reportNumber}. Skipping PDF delivery.`);
                return;
            }
            const result = await this.reportNotificationsService.sendInstallationReport(reportId, millName, email, whatsappNumber || '', authPersonPhone || '');
            if (result.whatsappSent || result.emailSent) {
                this.logger.log(`Installation Report ${reportNumber} PDF delivery initiated. ` +
                    `WhatsApp: ${result.whatsappSent}, Email: ${result.emailSent}`);
            }
            else {
                this.logger.error(`Failed to deliver Installation Report ${reportNumber} PDF. ` +
                    `WhatsApp Error: ${result.whatsappError || 'N/A'}, ` +
                    `Email Error: ${result.emailError || 'N/A'}`);
            }
        }
        catch (error) {
            this.logger.error('Error handling installation-report.created.send-pdf event', error);
        }
    }
    async onServiceReportSendPdf(payload) {
        try {
            const { reportId, triggeredBy } = payload;
            this.logger.log(`Manual PDF send requested for Service Report ${reportId} by user ${triggeredBy}`);
            const report = await this.prisma.serviceReport.findUnique({
                where: { id: reportId },
                include: {
                    mill: { select: { name: true } },
                },
            });
            if (!report) {
                this.logger.error(`Service Report ${reportId} not found`);
                return;
            }
            const millName = report.mill?.name || 'Unknown Mill';
            const result = await this.reportNotificationsService.sendServiceReport(reportId, millName, report.mill_email, report.mill_whatsapp_number, report.authorized_person_phone || undefined);
            this.logger.log(`Manual Service Report PDF send completed. ` +
                `WhatsApp: ${result.whatsappSent}, Email: ${result.emailSent}`);
        }
        catch (error) {
            this.logger.error('Error handling service-report.send-pdf event', error);
        }
    }
    async onInstallationReportSendPdf(payload) {
        try {
            const { reportId, triggeredBy } = payload;
            this.logger.log(`Manual PDF send requested for Installation Report ${reportId} by user ${triggeredBy}`);
            const report = await this.prisma.installationReport.findUnique({
                where: { id: reportId },
                include: {
                    mill: { select: { name: true } },
                },
            });
            if (!report) {
                this.logger.error(`Installation Report ${reportId} not found`);
                return;
            }
            const millName = report.mill?.name || 'Unknown Mill';
            const result = await this.reportNotificationsService.sendInstallationReport(reportId, millName, report.mill_email, report.mill_whatsapp_number, report.authorized_person_phone || undefined);
            this.logger.log(`Manual Installation Report PDF send completed. ` +
                `WhatsApp: ${result.whatsappSent}, Email: ${result.emailSent}`);
        }
        catch (error) {
            this.logger.error('Error handling installation-report.send-pdf event', error);
        }
    }
};
exports.ReportNotificationsEventListener = ReportNotificationsEventListener;
__decorate([
    (0, event_emitter_1.OnEvent)('service-report.created.send-pdf'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReportNotificationsEventListener.prototype, "onServiceReportCreatedForPdf", null);
__decorate([
    (0, event_emitter_1.OnEvent)('installation-report.created.send-pdf'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReportNotificationsEventListener.prototype, "onInstallationReportCreatedForPdf", null);
__decorate([
    (0, event_emitter_1.OnEvent)('service-report.send-pdf'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReportNotificationsEventListener.prototype, "onServiceReportSendPdf", null);
__decorate([
    (0, event_emitter_1.OnEvent)('installation-report.send-pdf'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReportNotificationsEventListener.prototype, "onInstallationReportSendPdf", null);
exports.ReportNotificationsEventListener = ReportNotificationsEventListener = ReportNotificationsEventListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [report_notifications_service_1.ReportNotificationsService,
        prisma_service_1.PrismaService])
], ReportNotificationsEventListener);
//# sourceMappingURL=report-notifications.event-listener.js.map