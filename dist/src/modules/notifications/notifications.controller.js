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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const passport_1 = require("@nestjs/passport");
const notifications_service_1 = require("./notifications.service");
const register_push_token_dto_1 = require("./dto/register-push-token.dto");
const broadcast_notification_dto_1 = require("./dto/broadcast-notification.dto");
const log_activity_decorator_1 = require("../activity-logs/decorators/log-activity.decorator");
const activity_action_enum_1 = require("../activity-logs/enums/activity-action.enum");
let NotificationsController = class NotificationsController {
    notificationsService;
    constructor(notificationsService) {
        this.notificationsService = notificationsService;
    }
    registerPushToken(req, dto) {
        return this.notificationsService.registerPushToken(req.user.userId, dto.token, dto.device_type);
    }
    getNotifications(req, skip, take) {
        return this.notificationsService.getUserNotifications(req.user.userId, skip ? parseInt(skip, 10) : 0, take ? parseInt(take, 10) : 20);
    }
    markAsRead(req, id) {
        return this.notificationsService.markAsRead(req.user.userId, id);
    }
    markAllAsRead(req) {
        return this.notificationsService.markAllAsRead(req.user.userId);
    }
    async broadcast(dto) {
        if (dto.target === broadcast_notification_dto_1.NotificationTarget.ROLE && (dto.role_names?.length || dto.role_name)) {
            const roleNames = dto.role_names?.length
                ? dto.role_names
                : [dto.role_name];
            await this.notificationsService.broadcastToRoles(roleNames, dto.title, dto.message, dto.type, dto.meta_data);
        }
        else if (dto.target === broadcast_notification_dto_1.NotificationTarget.USERS && dto.user_ids?.length) {
            await this.notificationsService.sendToUsers(dto.user_ids, dto.title, dto.message, dto.type, dto.meta_data);
        }
        else {
            await this.notificationsService.broadcast(dto.title, dto.message, dto.type, dto.meta_data);
        }
        return { message: 'Broadcast notification dispatched successfully' };
    }
};
exports.NotificationsController = NotificationsController;
__decorate([
    (0, common_1.Post)('push-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Register an FCM push token for the current user' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, register_push_token_dto_1.RegisterPushTokenDto]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "registerPushToken", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get paginated notifications for the current user' }),
    (0, swagger_1.ApiQuery)({ name: 'skip', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'take', required: false, type: Number }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('skip')),
    __param(2, (0, common_1.Query)('take')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "getNotifications", null);
__decorate([
    (0, common_1.Patch)(':id/read'),
    (0, swagger_1.ApiOperation)({ summary: 'Mark a specific notification as read' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Notification ID' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "markAsRead", null);
__decorate([
    (0, common_1.Patch)('read-all'),
    (0, swagger_1.ApiOperation)({ summary: 'Mark all notifications as read for the current user' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NotificationsController.prototype, "markAllAsRead", null);
__decorate([
    (0, common_1.Post)('broadcast'),
    (0, swagger_1.ApiOperation)({ summary: 'Send a broadcast notification (Admin only)' }),
    (0, log_activity_decorator_1.LogActivity)({
        action: activity_action_enum_1.ActivityAction.CREATE,
        entityType: 'notifications',
        description: (ctx) => {
            const target = ctx.body.target;
            const title = ctx.body.title;
            if (target === 'ROLE') {
                return `Broadcast notification "${title}" to roles: ${ctx.body.role_names?.join(', ') || ctx.body.role_name}`;
            }
            else if (target === 'USERS') {
                return `Sent notification "${title}" to ${ctx.body.user_ids?.length || 0} users`;
            }
            return `Broadcast notification "${title}" to all users`;
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [broadcast_notification_dto_1.BroadcastNotificationDto]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "broadcast", null);
exports.NotificationsController = NotificationsController = __decorate([
    (0, swagger_1.ApiTags)('Notifications'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Controller)('notifications'),
    __metadata("design:paramtypes", [notifications_service_1.NotificationsService])
], NotificationsController);
//# sourceMappingURL=notifications.controller.js.map