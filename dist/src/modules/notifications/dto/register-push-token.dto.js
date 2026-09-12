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
exports.RegisterPushTokenDto = exports.DeviceType = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
var DeviceType;
(function (DeviceType) {
    DeviceType["WEB"] = "WEB";
    DeviceType["ANDROID"] = "ANDROID";
    DeviceType["IOS"] = "IOS";
})(DeviceType || (exports.DeviceType = DeviceType = {}));
class RegisterPushTokenDto {
    token;
    device_type = DeviceType.WEB;
}
exports.RegisterPushTokenDto = RegisterPushTokenDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'FCM device push token' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RegisterPushTokenDto.prototype, "token", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: DeviceType,
        default: DeviceType.WEB,
        description: 'Device type that registered the token',
    }),
    (0, class_validator_1.IsEnum)(DeviceType),
    __metadata("design:type", String)
], RegisterPushTokenDto.prototype, "device_type", void 0);
//# sourceMappingURL=register-push-token.dto.js.map