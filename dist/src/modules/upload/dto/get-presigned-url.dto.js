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
exports.GetPresignedUrlDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class GetPresignedUrlDto {
    fileName;
    fileType;
}
exports.GetPresignedUrlDto = GetPresignedUrlDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'profile-picture.jpg' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], GetPresignedUrlDto.prototype, "fileName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'image/jpeg' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Matches)(/^image\/(jpeg|jpg|png|webp|gif|svg\+xml|bmp|tiff|avif|heic|heif)$/, {
        message: 'Only image files are allowed (jpeg, jpg, png, webp, gif, svg, bmp, tiff, avif, heic, heif)',
    }),
    __metadata("design:type", String)
], GetPresignedUrlDto.prototype, "fileType", void 0);
//# sourceMappingURL=get-presigned-url.dto.js.map