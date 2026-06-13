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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BroadcastNotificationDto = exports.NotificationTarget = exports.NotificationType = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
var NotificationType;
(function (NotificationType) {
    NotificationType["SERVICE_REPORT"] = "SERVICE_REPORT";
    NotificationType["INSTALLATION"] = "INSTALLATION";
    NotificationType["EXPENSE"] = "EXPENSE";
    NotificationType["TICKET"] = "TICKET";
    NotificationType["BROADCAST"] = "BROADCAST";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var NotificationTarget;
(function (NotificationTarget) {
    NotificationTarget["ALL"] = "ALL";
    NotificationTarget["ROLE"] = "ROLE";
    NotificationTarget["USERS"] = "USERS";
})(NotificationTarget || (exports.NotificationTarget = NotificationTarget = {}));
class BroadcastNotificationDto {
    title;
    message;
    type = NotificationType.BROADCAST;
    target = NotificationTarget.ALL;
    role_name;
    role_names;
    user_ids;
    meta_data;
}
exports.BroadcastNotificationDto = BroadcastNotificationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Notification title' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], BroadcastNotificationDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Notification message body' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], BroadcastNotificationDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: NotificationType,
        default: NotificationType.BROADCAST,
    }),
    (0, class_validator_1.IsEnum)(NotificationType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], BroadcastNotificationDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: NotificationTarget,
        default: NotificationTarget.ALL,
        description: 'Who should receive this notification',
    }),
    (0, class_validator_1.IsEnum)(NotificationTarget),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], BroadcastNotificationDto.prototype, "target", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Role name to target when target=ROLE (e.g. "Service Engineer")',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], BroadcastNotificationDto.prototype, "role_name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Multiple role names to target when target=ROLE',
        type: [String],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], BroadcastNotificationDto.prototype, "role_names", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Specific user IDs to target when target=USERS',
        type: [String],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], BroadcastNotificationDto.prototype, "user_ids", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Optional extra metadata JSON' }),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], BroadcastNotificationDto.prototype, "meta_data", void 0);
//# sourceMappingURL=broadcast-notification.dto.js.map