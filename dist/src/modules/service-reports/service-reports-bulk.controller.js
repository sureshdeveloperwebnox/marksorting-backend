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
exports.ServiceReportsBulkController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const platform_express_1 = require("@nestjs/platform-express");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const service_reports_bulk_service_1 = require("./service-reports-bulk.service");
const service_report_bulk_upload_dto_1 = require("./dto/service-report-bulk-upload.dto");
let ServiceReportsBulkController = class ServiceReportsBulkController {
    bulkService;
    constructor(bulkService) {
        this.bulkService = bulkService;
    }
    async getTemplate(res) {
        const buffer = await this.bulkService.generateTemplate();
        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename="service_reports_template.xlsx"',
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
exports.ServiceReportsBulkController = ServiceReportsBulkController;
__decorate([
    (0, common_1.Get)('bulk-upload/template'),
    (0, swagger_1.ApiOperation)({ summary: 'Download the service report bulk upload Excel template' }),
    __param(0, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ServiceReportsBulkController.prototype, "getTemplate", null);
__decorate([
    (0, common_1.Post)('bulk-upload/preview'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload a service report Excel file and preview parsed rows' }),
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
], ServiceReportsBulkController.prototype, "previewUpload", null);
__decorate([
    (0, common_1.Post)('bulk-upload/import'),
    (0, common_1.HttpCode)(202),
    (0, swagger_1.ApiOperation)({ summary: 'Confirm and start bulk import of service reports' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [service_report_bulk_upload_dto_1.ServiceReportBulkImportDto]),
    __metadata("design:returntype", Promise)
], ServiceReportsBulkController.prototype, "confirmImport", null);
__decorate([
    (0, common_1.Get)('bulk-upload/status/:importId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get the status of an ongoing or completed service report import' }),
    __param(0, (0, common_1.Param)('importId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ServiceReportsBulkController.prototype, "getStatus", null);
exports.ServiceReportsBulkController = ServiceReportsBulkController = __decorate([
    (0, swagger_1.ApiTags)('service-reports'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('service-reports'),
    __metadata("design:paramtypes", [service_reports_bulk_service_1.ServiceReportsBulkService])
], ServiceReportsBulkController);
//# sourceMappingURL=service-reports-bulk.controller.js.map