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
var S3Service_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3Service = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
let S3Service = S3Service_1 = class S3Service {
    configService;
    s3Client;
    logger = new common_1.Logger(S3Service_1.name);
    bucketName;
    region;
    endpoint;
    constructor(configService) {
        this.configService = configService;
        this.region = this.configService.getOrThrow('s3.region');
        this.bucketName = this.configService.getOrThrow('s3.bucketName');
        this.endpoint = this.configService.getOrThrow('s3.baseUrl');
        this.s3Client = new client_s3_1.S3Client({
            region: this.region,
            endpoint: this.endpoint,
            credentials: {
                accessKeyId: this.configService.getOrThrow('s3.accessKey'),
                secretAccessKey: this.configService.getOrThrow('s3.secretAccessKey'),
            },
            forcePathStyle: false,
        });
    }
    async getPresignedUploadUrl(key, contentType, expiresIn = 900) {
        try {
            const command = new client_s3_1.PutObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                ContentType: contentType,
            });
            return await (0, s3_request_presigner_1.getSignedUrl)(this.s3Client, command, { expiresIn });
        }
        catch (error) {
            this.logger.error(`Error generating presigned upload URL: ${error.message}`);
            throw error;
        }
    }
    async getPresignedViewUrl(key, expiresIn = 3600) {
        if (!key)
            return null;
        if (key.startsWith('http'))
            return key;
        try {
            const command = new client_s3_1.GetObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            });
            return await (0, s3_request_presigner_1.getSignedUrl)(this.s3Client, command, { expiresIn });
        }
        catch (error) {
            this.logger.error(`Error generating presigned view URL: ${error.message}`);
            throw error;
        }
    }
    getFileUrl(key) {
        if (!key)
            return null;
        if (key.startsWith('http'))
            return key;
        const url = new URL(this.endpoint);
        return `${url.protocol}//${this.bucketName}.${url.host}/${key}`;
    }
    getStorageInfo() {
        return {
            baseUrl: this.endpoint,
            bucketName: this.bucketName,
        };
    }
};
exports.S3Service = S3Service;
exports.S3Service = S3Service = S3Service_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], S3Service);
//# sourceMappingURL=s3.service.js.map