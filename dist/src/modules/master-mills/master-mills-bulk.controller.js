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
exports.MasterMillsBulkController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const platform_express_1 = require("@nestjs/platform-express");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const master_mills_bulk_service_1 = require("./master-mills-bulk.service");
const bulk_upload_dto_1 = require("./dto/bulk-upload.dto");
let MasterMillsBulkController = class MasterMillsBulkController {
    bulkService;
    constructor(bulkService) {
        this.bulkService = bulkService;
    }
    async getTemplate(res) {
        const buffer = await this.bulkService.generateTemplate();
        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename="master_mills_template.xlsx"',
        });
        return new common_1.StreamableFile(buffer);
    }
    previewUpload(file) {
        if (!file) {
            throw new common_1.BadRequestException('No file uploaded');
        }
        return this.bulkService.previewUpload(file);
    }
    async confirmImport(dto) {
        await this.bulkService.confirmImport(dto.importId);
        return { message: 'Import started' };
    }
    getStatus(importId) {
        return this.bulkService.getImportStatus(importId);
    }
};
exports.MasterMillsBulkController = MasterMillsBulkController;
__decorate([
    (0, common_1.Get)('bulk-upload/template'),
    (0, swagger_1.ApiOperation)({ summary: 'Download the bulk upload Excel template' }),
    __param(0, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MasterMillsBulkController.prototype, "getTemplate", null);
__decorate([
    (0, common_1.Post)('bulk-upload/preview'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload an Excel file and preview parsed rows before import' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
            },
        },
    }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', { limits: { fileSize: 10 * 1024 * 1024 } })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MasterMillsBulkController.prototype, "previewUpload", null);
__decorate([
    (0, common_1.Post)('bulk-upload/import'),
    (0, common_1.HttpCode)(202),
    (0, swagger_1.ApiOperation)({ summary: 'Confirm import of a previously previewed upload session' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bulk_upload_dto_1.BulkUploadImportDto]),
    __metadata("design:returntype", Promise)
], MasterMillsBulkController.prototype, "confirmImport", null);
__decorate([
    (0, common_1.Get)('bulk-upload/status/:importId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get the current status of an ongoing or completed import' }),
    __param(0, (0, common_1.Param)('importId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MasterMillsBulkController.prototype, "getStatus", null);
exports.MasterMillsBulkController = MasterMillsBulkController = __decorate([
    (0, swagger_1.ApiTags)('master-mills'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('master-mills'),
    __metadata("design:paramtypes", [master_mills_bulk_service_1.MasterMillsBulkService])
], MasterMillsBulkController);
//# sourceMappingURL=master-mills-bulk.controller.js.map