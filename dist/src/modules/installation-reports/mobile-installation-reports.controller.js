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
exports.MobileInstallationReportsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const installation_reports_service_1 = require("./installation-reports.service");
const create_mobile_installation_report_dto_1 = require("./dto/create-mobile-installation-report.dto");
const update_mobile_installation_report_dto_1 = require("./dto/update-mobile-installation-report.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let MobileInstallationReportsController = class MobileInstallationReportsController {
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
    async downloadPdf(id, req, res) {
        const { buffer, fileName } = await this.installationReportsService.generatePdf(id, req.user);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Length', buffer.length);
        res.end(buffer);
    }
};
exports.MobileInstallationReportsController = MobileInstallationReportsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: '[Mobile] List installation reports assigned to the logged-in engineer',
        description: 'Service Engineers only see reports they are assigned to. ' +
            'Other roles (Admin, Manager, etc.) see all reports.',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'skip',
        required: false,
        type: String,
        description: 'Offset (default 0)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'take',
        required: false,
        type: String,
        description: 'Page size (default 10)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'search',
        required: false,
        type: String,
        description: 'Search by report number, place, serial no, machine model',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'status',
        required: false,
        type: String,
        description: 'Filter by status: PENDING | IN_PROGRESS | COMPLETED | CANCELLED',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'dateFrom',
        required: false,
        type: String,
        description: 'Visit date from (YYYY-MM-DD)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'dateTo',
        required: false,
        type: String,
        description: 'Visit date to (YYYY-MM-DD)',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Paginated list of installation reports',
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid JWT token' }),
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
], MobileInstallationReportsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: '[Mobile] Get a single installation report by ID',
        description: 'Service Engineers are blocked with 403 if they are not assigned to the report.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Installation report detail' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid JWT token' }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Not assigned to this installation report',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Installation report not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MobileInstallationReportsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({
        summary: '[Mobile] Create a new installation report',
        description: "For Service Engineers the logged-in engineer's ID is automatically " +
            'appended to technician_ids even if omitted from the body.',
    }),
    (0, swagger_1.ApiBody)({
        type: create_mobile_installation_report_dto_1.CreateMobileInstallationReportDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Installation report created' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation error' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid JWT token' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_mobile_installation_report_dto_1.CreateMobileInstallationReportDto, Object]),
    __metadata("design:returntype", void 0)
], MobileInstallationReportsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: '[Mobile] Update an existing installation report',
        description: 'Service Engineers can only update reports they are assigned to.',
    }),
    (0, swagger_1.ApiBody)({
        type: update_mobile_installation_report_dto_1.UpdateMobileInstallationReportDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Installation report updated' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation error' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid JWT token' }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Not assigned to this installation report',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Installation report not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_mobile_installation_report_dto_1.UpdateMobileInstallationReportDto, Object]),
    __metadata("design:returntype", void 0)
], MobileInstallationReportsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: '[Mobile] Soft-delete an installation report',
        description: 'Service Engineers can only delete reports they are assigned to.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Installation report soft-deleted' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid JWT token' }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Not assigned to this installation report',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Installation report not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MobileInstallationReportsController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(':id/pdf'),
    (0, swagger_1.ApiOperation)({
        summary: '[Mobile] Download installation report as PDF',
        description: 'Service Engineers can only download PDFs for reports they are assigned to.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'PDF file stream' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid JWT token' }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Not assigned to this installation report',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Installation report not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], MobileInstallationReportsController.prototype, "downloadPdf", null);
exports.MobileInstallationReportsController = MobileInstallationReportsController = __decorate([
    (0, swagger_1.ApiTags)('mobile / installation-reports'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('mobile/installation-reports'),
    __metadata("design:paramtypes", [installation_reports_service_1.InstallationReportsService])
], MobileInstallationReportsController);
//# sourceMappingURL=mobile-installation-reports.controller.js.map