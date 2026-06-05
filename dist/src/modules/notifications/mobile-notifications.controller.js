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
exports.MobileNotificationsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const notifications_service_1 = require("./notifications.service");
const register_push_token_dto_1 = require("./dto/register-push-token.dto");
const notificationSchema = {
    type: 'object',
    properties: {
        id: { type: 'string', format: 'uuid', example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
        user_id: { type: 'string', format: 'uuid', nullable: true, example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
        title: { type: 'string', example: 'New Service Report Created' },
        message: { type: 'string', example: 'Service Report SR-20260528-1 has been created for mill "ABC Mill".' },
        type: {
            type: 'string',
            enum: ['SERVICE_REPORT', 'INSTALLATION', 'EXPENSE', 'TICKET', 'BROADCAST'],
            example: 'SERVICE_REPORT',
        },
        status: { type: 'string', enum: ['UNREAD', 'READ'], example: 'UNREAD' },
        meta_data: {
            type: 'object',
            nullable: true,
            additionalProperties: true,
            example: { reportNumber: 'SR-20260528-1', millName: 'ABC Mill' },
        },
        created_at: { type: 'string', format: 'date-time', example: '2026-05-28T04:00:00.000Z' },
    },
};
const paginatedNotificationsSchema = {
    type: 'object',
    properties: {
        notifications: { type: 'array', items: notificationSchema },
        total: { type: 'integer', example: 50 },
        unreadCount: { type: 'integer', example: 5 },
    },
};
const errorSchema = (message) => ({
    type: 'object',
    properties: {
        statusCode: { type: 'integer' },
        message: { type: 'string', example: message },
    },
});
let MobileNotificationsController = class MobileNotificationsController {
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
    markAllAsRead(req) {
        return this.notificationsService.markAllAsRead(req.user.userId);
    }
    markAsRead(req, id) {
        return this.notificationsService.markAsRead(req.user.userId, id);
    }
};
exports.MobileNotificationsController = MobileNotificationsController;
__decorate([
    (0, common_1.Post)('push-token'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: '[Mobile] Register FCM push token',
        description: 'Registers or updates an FCM device push token for the authenticated user.\n\n' +
            'Call this on every app launch **after login** and whenever `onTokenRefresh` fires.\n\n' +
            '**Upsert behaviour:** If the same `token` already exists for this user it is updated in place ' +
            '(device_type may change). Duplicate tokens across different users are not allowed — ' +
            'deregister the old token first if the device changes hands.',
    }),
    (0, swagger_1.ApiBody)({ type: register_push_token_dto_1.RegisterPushTokenDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Token registered / updated successfully',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string', format: 'uuid' },
                user_id: { type: 'string', format: 'uuid' },
                token: { type: 'string', example: 'fcm_token_string_here' },
                device_type: { type: 'string', enum: ['WEB', 'ANDROID', 'IOS'], example: 'ANDROID' },
                created_at: { type: 'string', format: 'date-time' },
                updated_at: { type: 'string', format: 'date-time' },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation error — missing or invalid token', schema: errorSchema('token should not be empty') }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid JWT bearer token', schema: errorSchema('Unauthorized') }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, register_push_token_dto_1.RegisterPushTokenDto]),
    __metadata("design:returntype", void 0)
], MobileNotificationsController.prototype, "registerPushToken", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: '[Mobile] List notifications for the logged-in technician',
        description: 'Returns paginated notifications for the authenticated user ordered by `created_at DESC`.\n\n' +
            'The response also includes `total` (total record count) and `unreadCount` ' +
            '(number of UNREAD notifications) so the mobile app can render the badge without a separate call.\n\n' +
            '**Recommended page size:** `take=20` on initial load, then load more on scroll.',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'skip',
        required: false,
        type: Number,
        description: 'Number of records to skip for pagination (default `0`)',
        example: 0,
    }),
    (0, swagger_1.ApiQuery)({
        name: 'take',
        required: false,
        type: Number,
        description: 'Maximum number of records to return (default `20`, max recommended `50`)',
        example: 20,
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Paginated notification list with unread count',
        schema: paginatedNotificationsSchema,
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid JWT bearer token', schema: errorSchema('Unauthorized') }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('skip')),
    __param(2, (0, common_1.Query)('take')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], MobileNotificationsController.prototype, "getNotifications", null);
__decorate([
    (0, common_1.Patch)('read-all'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: '[Mobile] Mark all notifications as read',
        description: 'Sets `status = READ` on **all** UNREAD notifications belonging to the authenticated user.\n\n' +
            'Returns a Prisma batch result with `count` indicating how many records were updated.\n\n' +
            'Safe to call even when there are zero unread notifications — returns `{ count: 0 }`.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'All notifications marked as read',
        schema: {
            type: 'object',
            properties: {
                count: { type: 'integer', example: 5, description: 'Number of notifications updated' },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid JWT bearer token', schema: errorSchema('Unauthorized') }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MobileNotificationsController.prototype, "markAllAsRead", null);
__decorate([
    (0, common_1.Patch)(':id/read'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: '[Mobile] Mark a single notification as read',
        description: 'Sets `status = READ` on the specified notification.\n\n' +
            'Returns **404** if the notification does not exist or does not belong to the authenticated user ' +
            '(ownership is strictly enforced — a user cannot mark another user\'s notification as read).',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String, format: 'uuid', description: 'Notification UUID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Notification marked as read — returns the updated notification object',
        schema: notificationSchema,
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid JWT bearer token', schema: errorSchema('Unauthorized') }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Notification not found or does not belong to this user', schema: errorSchema('Notification not found') }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], MobileNotificationsController.prototype, "markAsRead", null);
exports.MobileNotificationsController = MobileNotificationsController = __decorate([
    (0, swagger_1.ApiTags)('mobile / notifications'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('mobile/notifications'),
    __metadata("design:paramtypes", [notifications_service_1.NotificationsService])
], MobileNotificationsController);
//# sourceMappingURL=mobile-notifications.controller.js.map