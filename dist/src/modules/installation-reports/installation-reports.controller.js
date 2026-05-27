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
exports.InstallationReportsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const installation_reports_service_1 = require("./installation-reports.service");
const create_installation_report_dto_1 = require("./dto/create-installation-report.dto");
const update_installation_report_dto_1 = require("./dto/update-installation-report.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let InstallationReportsController = class InstallationReportsController {
    installationReportsService;
    constructor(installationReportsService) {
        this.installationReportsService = installationReportsService;
    }
    findAll(req, skip, take, search, status, dateFrom, dateTo) {
        return this.installationReportsService.findAll({
            skip: skip ? parseInt(skip, 10) : 0,
            take: take ? parseInt(take, 10) : 10,
            search,
            status,
            dateFrom,
            dateTo,
        }, req.user);
    }
    async downloadPdf(id, req, res) {
        const { buffer, fileName } = await this.installationReportsService.generatePdf(id, req.user);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Length', buffer.length);
        res.end(buffer);
    }
    findOne(id, req) {
        return this.installationReportsService.findById(id, req.user);
    }
    create(dto, req) {
        return this.installationReportsService.create(dto, req.user);
    }
    update(id, dto, req) {
        return this.installationReportsService.update(id, dto, req.user);
    }
    remove(id, req) {
        return this.installationReportsService.remove(id, req.user);
    }
};
exports.InstallationReportsController = InstallationReportsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get all installation reports with pagination and filtering',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'skip',
        required: false,
        type: String,
        description: 'Number of records to skip',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'take',
        required: false,
        type: String,
        description: 'Number of records to take',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'search',
        required: false,
        type: String,
        description: 'Search term for report number, place, machine model, serial no',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'status',
        required: false,
        type: String,
        description: 'Filter by status',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'dateFrom',
        required: false,
        type: String,
        description: 'Filter from visit date (YYYY-MM-DD)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'dateTo',
        required: false,
        type: String,
        description: 'Filter to visit date (YYYY-MM-DD)',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'List of installation reports successfully retrieved',
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized access' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('skip')),
    __param(2, (0, common_1.Query)('take')),
    __param(3, (0, common_1.Query)('search')),
    __param(4, (0, common_1.Query)('status')),
    __param(5, (0, common_1.Query)('dateFrom')),
    __param(6, (0, common_1.Query)('dateTo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], InstallationReportsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id/pdf'),
    (0, swagger_1.ApiOperation)({ summary: 'Download installation report PDF' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Installation report PDF file' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized access' }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden access to this installation report',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Installation report not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], InstallationReportsController.prototype, "downloadPdf", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get installation report by ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Installation report details successfully retrieved',
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized access' }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden access to this installation report',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Installation report not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], InstallationReportsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create new installation report' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Installation report successfully created',
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid input payload' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized access' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_installation_report_dto_1.CreateInstallationReportDto, Object]),
    __metadata("design:returntype", void 0)
], InstallationReportsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update existing installation report' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Installation report successfully updated',
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid input payload' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized access' }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden access to edit this installation report',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Installation report not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_installation_report_dto_1.UpdateInstallationReportDto, Object]),
    __metadata("design:returntype", void 0)
], InstallationReportsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Soft delete installation report' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Installation report successfully deleted',
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized access' }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden access to delete this installation report',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Installation report not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], InstallationReportsController.prototype, "remove", null);
exports.InstallationReportsController = InstallationReportsController = __decorate([
    (0, swagger_1.ApiTags)('installation-reports'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('installation-reports'),
    __metadata("design:paramtypes", [installation_reports_service_1.InstallationReportsService])
], InstallationReportsController);
//# sourceMappingURL=installation-reports.controller.js.map