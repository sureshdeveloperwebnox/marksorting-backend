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
exports.UploadService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const uuid_1 = require("uuid");
const s3_service_1 = require("../../shared/services/s3.service");
let UploadService = class UploadService {
    s3Service;
    configService;
    folderName;
    allowedImageTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/svg+xml',
        'image/bmp',
        'image/tiff',
        'image/avif',
        'image/heic',
        'image/heif',
    ];
    constructor(s3Service, configService) {
        this.s3Service = s3Service;
        this.configService = configService;
        this.folderName =
            this.configService.get('s3.folderName') || 'uploads';
    }
    async createPresignedUrl(dto) {
        const { fileName, fileType } = dto;
        const extension = fileName.split('.').pop();
        const uniqueFileName = `${(0, uuid_1.v4)()}.${extension}`;
        const key = `${this.folderName}/${uniqueFileName}`;
        const uploadUrl = await this.s3Service.getPresignedUploadUrl(key, fileType);
        const fileUrl = this.s3Service.getFileUrl(key);
        return {
            uploadUrl,
            fileUrl,
            key,
            baseUrl: this.configService.get('s3.baseUrl'),
        };
    }
    async getViewUrl(key) {
        const viewUrl = await this.s3Service.getPresignedViewUrl(key);
        return {
            viewUrl,
            key,
        };
    }
    async uploadFile(fileBuffer, originalName, mimeType) {
        if (!this.allowedImageTypes.includes(mimeType.toLowerCase())) {
            throw new common_1.BadRequestException(`Invalid file type: ${mimeType}. Only image files are allowed (jpeg, png, webp, gif, svg, bmp, tiff, avif, heic, heif).`);
        }
        const extension = originalName.split('.').pop() || 'png';
        const uniqueFileName = `${(0, uuid_1.v4)()}.${extension}`;
        const key = `${this.folderName}/${uniqueFileName}`;
        return this.s3Service.uploadFile(key, fileBuffer, mimeType);
    }
    async uploadBase64Image(base64String, fileName) {
        let base64Data = base64String;
        let mimeType = 'image/png';
        if (base64String.includes(',')) {
            const parts = base64String.split(',');
            const header = parts[0];
            base64Data = parts[1];
            const mimeMatch = header.match(/data:([^;]+);base64/);
            if (mimeMatch) {
                mimeType = mimeMatch[1];
            }
        }
        if (!this.allowedImageTypes.includes(mimeType.toLowerCase())) {
            throw new common_1.BadRequestException(`Invalid file type: ${mimeType}. Only image files are allowed.`);
        }
        const buffer = Buffer.from(base64Data, 'base64');
        const extension = mimeType.split('/')[1] || 'png';
        const finalFileName = fileName || `image.${extension}`;
        return this.uploadFile(buffer, finalFileName, mimeType);
    }
};
exports.UploadService = UploadService;
exports.UploadService = UploadService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [s3_service_1.S3Service,
        config_1.ConfigService])
], UploadService);
//# sourceMappingURL=upload.service.js.map