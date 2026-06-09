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
exports.UploadController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const upload_service_1 = require("./upload.service");
const get_presigned_url_dto_1 = require("./dto/get-presigned-url.dto");
const upload_image_dto_1 = require("./dto/upload-image.dto");
let UploadController = class UploadController {
    uploadService;
    constructor(uploadService) {
        this.uploadService = uploadService;
    }
    async getPresignedUrl(getPresignedUrlDto) {
        return this.uploadService.createPresignedUrl(getPresignedUrlDto);
    }
    async uploadBase64Image(dto) {
        const result = await this.uploadService.uploadBase64Image(dto.image, dto.fileName);
        return {
            ...result,
            message: 'Image uploaded successfully',
        };
    }
    async uploadFile(file) {
        if (!file) {
            throw new Error('No file provided');
        }
        const result = await this.uploadService.uploadFile(file.buffer, file.originalname, file.mimetype);
        return {
            ...result,
            message: 'File uploaded successfully',
        };
    }
};
exports.UploadController = UploadController;
__decorate([
    (0, common_1.Post)('presigned-url'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a presigned URL for file upload' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Presigned URL generated successfully',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_presigned_url_dto_1.GetPresignedUrlDto]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "getPresignedUrl", null);
__decorate([
    (0, common_1.Post)('image'),
    (0, swagger_1.ApiOperation)({
        summary: 'Upload an image directly (base64)',
        description: 'Upload an image as base64 string. Returns the S3 key to save in database.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Image uploaded successfully',
        schema: {
            type: 'object',
            properties: {
                key: {
                    type: 'string',
                    example: 'marksorting/abc123.png',
                },
                fileUrl: {
                    type: 'string',
                    example: 'https://webnox.blr1.digitaloceanspaces.com/marksorting/abc123.png',
                },
                message: { type: 'string', example: 'Image uploaded successfully' },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid image data or file type' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [upload_image_dto_1.UploadImageDto]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "uploadBase64Image", null);
__decorate([
    (0, common_1.Post)('file'),
    (0, swagger_1.ApiOperation)({
        summary: 'Upload an image file directly (multipart/form-data)',
        description: 'Upload an image file directly. Returns the S3 key to save in database.',
    }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'Image file to upload (jpeg, png, webp, gif, etc.)',
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'File uploaded successfully',
        schema: {
            type: 'object',
            properties: {
                key: {
                    type: 'string',
                    example: 'marksorting/abc123.png',
                },
                fileUrl: {
                    type: 'string',
                    example: 'https://webnox.blr1.digitaloceanspaces.com/marksorting/abc123.png',
                },
                message: { type: 'string', example: 'File uploaded successfully' },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid file type' }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "uploadFile", null);
exports.UploadController = UploadController = __decorate([
    (0, swagger_1.ApiTags)('Upload'),
    (0, common_1.Controller)('upload'),
    __metadata("design:paramtypes", [upload_service_1.UploadService])
], UploadController);
//# sourceMappingURL=upload.controller.js.map