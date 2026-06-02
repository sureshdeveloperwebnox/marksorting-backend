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
var ReportNotificationsController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportNotificationsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const event_emitter_1 = require("@nestjs/event-emitter");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const whatsapp_service_1 = require("../whatsapp/whatsapp.service");
class SendPdfDto {
    millWhatsappNumber;
    millEmail;
}
let ReportNotificationsController = ReportNotificationsController_1 = class ReportNotificationsController {
    eventEmitter;
    whatsAppService;
    logger = new common_1.Logger(ReportNotificationsController_1.name);
    constructor(eventEmitter, whatsAppService) {
        this.eventEmitter = eventEmitter;
        this.whatsAppService = whatsAppService;
    }
    async sendServiceReportPdf(reportId, dto, req) {
        const userId = req.user?.userId;
        this.logger.log(`Manual PDF send requested for Service Report ${reportId} by user ${userId}`);
        this.eventEmitter.emit('service-report.send-pdf', {
            reportId,
            triggeredBy: userId,
            millWhatsappNumber: dto.millWhatsappNumber,
            millEmail: dto.millEmail,
        });
        return {
            success: true,
            message: 'Service Report PDF delivery has been queued',
            reportId,
        };
    }
    async sendInstallationReportPdf(reportId, dto, req) {
        const userId = req.user?.userId;
        this.logger.log(`Manual PDF send requested for Installation Report ${reportId} by user ${userId}`);
        this.eventEmitter.emit('installation-report.send-pdf', {
            reportId,
            triggeredBy: userId,
            millWhatsappNumber: dto.millWhatsappNumber,
            millEmail: dto.millEmail,
        });
        return {
            success: true,
            message: 'Installation Report PDF delivery has been queued',
            reportId,
        };
    }
    async getWhatsAppQueueStats() {
        const stats = await this.whatsAppService.getQueueStats();
        return {
            success: true,
            data: stats,
        };
    }
};
exports.ReportNotificationsController = ReportNotificationsController;
__decorate([
    (0, common_1.Post)('service-reports/:id/send-pdf'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Send Service Report PDF manually via WhatsApp and Email' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Service Report ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'PDF send request queued successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Service report not found' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Insufficient permissions' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, SendPdfDto, Object]),
    __metadata("design:returntype", Promise)
], ReportNotificationsController.prototype, "sendServiceReportPdf", null);
__decorate([
    (0, common_1.Post)('installation-reports/:id/send-pdf'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Send Installation Report PDF manually via WhatsApp and Email' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Installation Report ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'PDF send request queued successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Installation report not found' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Insufficient permissions' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, SendPdfDto, Object]),
    __metadata("design:returntype", Promise)
], ReportNotificationsController.prototype, "sendInstallationReportPdf", null);
__decorate([
    (0, common_1.Post)('whatsapp/stats'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get WhatsApp queue statistics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Queue statistics retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReportNotificationsController.prototype, "getWhatsAppQueueStats", null);
exports.ReportNotificationsController = ReportNotificationsController = ReportNotificationsController_1 = __decorate([
    (0, swagger_1.ApiTags)('Report Notifications'),
    (0, common_1.Controller)('report-notifications'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [event_emitter_1.EventEmitter2,
        whatsapp_service_1.WhatsAppService])
], ReportNotificationsController);
//# sourceMappingURL=report-notifications.controller.js.map