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
};
exports.UploadService = UploadService;
exports.UploadService = UploadService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [s3_service_1.S3Service,
        config_1.ConfigService])
], UploadService);
//# sourceMappingURL=upload.service.js.map