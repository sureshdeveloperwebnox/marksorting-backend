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
var NotificationsEventListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsEventListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const notifications_service_1 = require("./notifications.service");
const broadcast_notification_dto_1 = require("./dto/broadcast-notification.dto");
let NotificationsEventListener = NotificationsEventListener_1 = class NotificationsEventListener {
    notificationsService;
    logger = new common_1.Logger(NotificationsEventListener_1.name);
    constructor(notificationsService) {
        this.notificationsService = notificationsService;
    }
    async onServiceReportCreated(payload) {
        try {
            const { reportId, reportNumber, millName, technicianUserIds, creatorUserId, } = payload;
            const title = 'New Service Report Created';
            const message = `Service Report ${reportNumber} has been created for mill "${millName}".`;
            await this.notificationsService.notifyStakeholders(technicianUserIds, creatorUserId, title, message, broadcast_notification_dto_1.NotificationType.SERVICE_REPORT, {
                reportId,
                entityId: reportId,
                reportNumber,
                millName,
                route: `/service-reports/${reportId || ''}`,
                screen: 'ServiceReportDetailScreen',
            });
        }
        catch (err) {
            this.logger.error('Error handling service-report.created event', err);
        }
    }
    async onInstallationReportCreated(payload) {
        try {
            const { reportId, reportNumber, millName, technicianUserIds, creatorUserId, } = payload;
            const title = 'New Installation Report Created';
            const message = `Installation Report ${reportNumber} has been created for mill "${millName}".`;
            await this.notificationsService.notifyStakeholders(technicianUserIds, creatorUserId, title, message, broadcast_notification_dto_1.NotificationType.INSTALLATION, {
                reportId,
                entityId: reportId,
                reportNumber,
                millName,
                route: `/installation-reports/${reportId || ''}`,
                screen: 'InstallationReportDetailScreen',
            });
        }
        catch (err) {
            this.logger.error('Error handling installation-report.created event', err);
        }
    }
    async onExpenseCreated(payload) {
        try {
            const { expenseId, expenseNumber, amount, creatorUserId, technicianUserIds, } = payload;
            const title = 'New Expense Submitted';
            const message = `Expense ${expenseNumber} of ₹${amount} has been submitted for approval.`;
            await this.notificationsService.notifyStakeholders(technicianUserIds || [], creatorUserId, title, message, broadcast_notification_dto_1.NotificationType.EXPENSE, {
                expenseId,
                entityId: expenseId,
                expenseNumber,
                amount,
                route: `/expenses/${expenseId || ''}`,
                screen: 'ExpenseDetailScreen',
            });
        }
        catch (err) {
            this.logger.error('Error handling expense.created event', err);
        }
    }
    async onExpenseStatusUpdated(payload) {
        try {
            const { expenseId, expenseNumber, status, technicianUserIds } = payload;
            const statusLabel = status === 'COMPLETED'
                ? 'approved'
                : status === 'CANCELLED'
                    ? 'rejected'
                    : status.toLowerCase();
            const title = 'Expense Status Updated';
            const message = `Your expense ${expenseNumber} has been ${statusLabel}.`;
            await this.notificationsService.sendToUsers(technicianUserIds, title, message, broadcast_notification_dto_1.NotificationType.EXPENSE, {
                expenseId,
                entityId: expenseId,
                expenseNumber,
                status,
                route: `/expenses/${expenseId || ''}`,
                screen: 'ExpenseDetailScreen',
            });
        }
        catch (err) {
            this.logger.error('Error handling expense.status_updated event', err);
        }
    }
    async onTicketCreated(payload) {
        try {
            const { ticketId, ticketNumber, subject, assignedTechnicianUserIds, creatorUserId, } = payload;
            const title = 'New Support Ticket Created';
            const message = `Ticket ${ticketNumber}: "${subject}" has been created.`;
            await this.notificationsService.notifyStakeholders(assignedTechnicianUserIds, creatorUserId, title, message, broadcast_notification_dto_1.NotificationType.TICKET, {
                ticketId,
                entityId: ticketId,
                ticketNumber,
                subject,
                route: `/tickets/${ticketId || ''}`,
                screen: 'TicketDetailScreen',
            });
        }
        catch (err) {
            this.logger.error('Error handling ticket.created event', err);
        }
    }
    async onTicketAssigned(payload) {
        try {
            const { ticketId, ticketNumber, subject, assignedTechnicianUserIds, } = payload;
            const title = 'Ticket Assigned to You';
            const message = `You have been assigned to Ticket ${ticketNumber}: "${subject}".`;
            await this.notificationsService.sendToUsers(assignedTechnicianUserIds, title, message, broadcast_notification_dto_1.NotificationType.TICKET, {
                ticketId,
                entityId: ticketId,
                ticketNumber,
                subject,
                route: `/tickets/${ticketId || ''}`,
                screen: 'TicketDetailScreen',
            });
        }
        catch (err) {
            this.logger.error('Error handling ticket.assigned event', err);
        }
    }
    async onStoreCreated(payload) {
        try {
            const { storeId, storeNumber, frameNumber, technicianUserId, serviceEngineerName, creatorUserId, inflowStatus, } = payload;
            const label = frameNumber ? `Frame ${frameNumber}` : (storeNumber || 'Store Record');
            const statusLabel = inflowStatus || 'Inflow';
            if (technicianUserId) {
                await this.notificationsService.createNotification(technicianUserId, 'New Store Record Assigned', `A new store record (${statusLabel}) for ${label} has been assigned to you.`, broadcast_notification_dto_1.NotificationType.STORE, {
                    storeId,
                    entityId: storeId,
                    storeNumber,
                    frameNumber,
                    inflowStatus,
                    route: `/stores/${storeId || ''}`,
                    screen: 'StoreDetailScreen',
                });
            }
            const adminMessage = `A new store record (${statusLabel}) for ${label} has been created${serviceEngineerName ? ` (Assigned to ${serviceEngineerName})` : ''}.`;
            await this.notificationsService.notifyStakeholders(technicianUserId ? [technicianUserId] : [], creatorUserId || undefined, 'New Store Record Created', adminMessage, broadcast_notification_dto_1.NotificationType.STORE, {
                storeId,
                entityId: storeId,
                storeNumber,
                frameNumber,
                inflowStatus,
                technicianUserId,
                route: `/stores/${storeId || ''}`,
                screen: 'StoreDetailScreen',
            });
        }
        catch (err) {
            this.logger.error('Error handling store.created event', err);
        }
    }
    async onStoreReturnUpdated(payload) {
        try {
            const { storeId, storeNumber, frameNumber, returnStatus, technicianUserId, creatorUserId, } = payload;
            const label = frameNumber ? `Frame ${frameNumber}` : (storeNumber || 'Store Return');
            if (technicianUserId && technicianUserId !== creatorUserId) {
                await this.notificationsService.createNotification(technicianUserId, 'Store Return Updated', `Store return details for ${label} have been updated (Status: ${returnStatus}).`, broadcast_notification_dto_1.NotificationType.STORE, {
                    storeId,
                    entityId: storeId,
                    storeNumber,
                    returnStatus,
                    frameNumber,
                    route: `/stores/${storeId || ''}`,
                    screen: 'StoreDetailScreen',
                });
            }
            const adminMessage = `Store return for ${label} has been updated to "${returnStatus}".`;
            await this.notificationsService.notifyStakeholders(technicianUserId ? [technicianUserId] : [], creatorUserId || undefined, 'Store Return Status Updated', adminMessage, broadcast_notification_dto_1.NotificationType.STORE, {
                storeId,
                entityId: storeId,
                storeNumber,
                returnStatus,
                frameNumber,
                route: `/stores/${storeId || ''}`,
                screen: 'StoreDetailScreen',
            });
        }
        catch (err) {
            this.logger.error('Error handling store.return_updated event', err);
        }
    }
};
exports.NotificationsEventListener = NotificationsEventListener;
__decorate([
    (0, event_emitter_1.OnEvent)('service-report.created'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsEventListener.prototype, "onServiceReportCreated", null);
__decorate([
    (0, event_emitter_1.OnEvent)('installation-report.created'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsEventListener.prototype, "onInstallationReportCreated", null);
__decorate([
    (0, event_emitter_1.OnEvent)('expense.created'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsEventListener.prototype, "onExpenseCreated", null);
__decorate([
    (0, event_emitter_1.OnEvent)('expense.status_updated'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsEventListener.prototype, "onExpenseStatusUpdated", null);
__decorate([
    (0, event_emitter_1.OnEvent)('ticket.created'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsEventListener.prototype, "onTicketCreated", null);
__decorate([
    (0, event_emitter_1.OnEvent)('ticket.assigned'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsEventListener.prototype, "onTicketAssigned", null);
__decorate([
    (0, event_emitter_1.OnEvent)('store.created'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsEventListener.prototype, "onStoreCreated", null);
__decorate([
    (0, event_emitter_1.OnEvent)('store.return_updated'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsEventListener.prototype, "onStoreReturnUpdated", null);
exports.NotificationsEventListener = NotificationsEventListener = NotificationsEventListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [notifications_service_1.NotificationsService])
], NotificationsEventListener);
//# sourceMappingURL=notifications.event-listener.js.map