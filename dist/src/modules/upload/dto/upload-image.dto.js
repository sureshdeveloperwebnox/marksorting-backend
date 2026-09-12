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
exports.UploadImageDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class UploadImageDto {
    image;
    fileName;
}
exports.UploadImageDto = UploadImageDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
        description: 'Base64 encoded image data (with or without data URI prefix)',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UploadImageDto.prototype, "image", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'expense-image.png',
        description: 'Optional original filename',
        required: false,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UploadImageDto.prototype, "fileName", void 0);
//# sourceMappingURL=upload-image.dto.js.map