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
exports.ServiceReportsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const service_reports_service_1 = require("./service-reports.service");
const create_service_report_dto_1 = require("./dto/create-service-report.dto");
const update_service_report_dto_1 = require("./dto/update-service-report.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const log_activity_decorator_1 = require("../activity-logs/decorators/log-activity.decorator");
const activity_action_enum_1 = require("../activity-logs/enums/activity-action.enum");
const description_helper_1 = require("../activity-logs/helpers/description.helper");
let ServiceReportsController = class ServiceReportsController {
    serviceReportsService;
    constructor(serviceReportsService) {
        this.serviceReportsService = serviceReportsService;
    }
    findAll(req, skip, take, search, status, serviceCategoryId, technicianId, dateFrom, dateTo) {
        return this.serviceReportsService.findAll({
            skip: skip ? parseInt(skip, 10) : 0,
            take: take ? parseInt(take, 10) : 10,
            search,
            status,
            serviceCategoryId,
            technicianId,
            dateFrom,
            dateTo,
        }, req.user);
    }
    async downloadPdf(id, req, res) {
        const { buffer, fileName } = await this.serviceReportsService.generatePdf(id, req.user);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Length', buffer.length);
        res.end(buffer);
    }
    findOne(id, req) {
        return this.serviceReportsService.findById(id, req.user);
    }
    create(dto, req) {
        return this.serviceReportsService.create(dto, req.user);
    }
    update(id, dto, req) {
        return this.serviceReportsService.update(id, dto, req.user);
    }
    remove(id, req) {
        return this.serviceReportsService.remove(id, req.user);
    }
};
exports.ServiceReportsController = ServiceReportsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get all service reports with pagination and filtering',
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
        description: 'Search term for name, place, serial no, machine model',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'status',
        required: false,
        type: String,
        description: 'Filter by status',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'serviceCategoryId',
        required: false,
        type: String,
        description: 'Filter by category ID',
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
        description: 'List of service reports successfully retrieved',
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized access' }),
    (0, swagger_1.ApiQuery)({
        name: 'technicianId',
        required: false,
        type: String,
        description: 'Filter by technician/service engineer ID',
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('skip')),
    __param(2, (0, common_1.Query)('take')),
    __param(3, (0, common_1.Query)('search')),
    __param(4, (0, common_1.Query)('status')),
    __param(5, (0, common_1.Query)('serviceCategoryId')),
    __param(6, (0, common_1.Query)('technicianId')),
    __param(7, (0, common_1.Query)('dateFrom')),
    __param(8, (0, common_1.Query)('dateTo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], ServiceReportsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id/pdf'),
    (0, swagger_1.ApiOperation)({ summary: 'Download service report PDF' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Service report PDF file' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized access' }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden access to this service report',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Service report not found' }),
    (0, log_activity_decorator_1.LogActivity)({
        action: activity_action_enum_1.ActivityAction.EXPORT,
        entityType: 'service_reports',
        entityIdParam: 'id',
        description: (ctx) => `Downloaded PDF for service report ${ctx.params.id} — file exported`,
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ServiceReportsController.prototype, "downloadPdf", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get service report by ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Service report details successfully retrieved',
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized access' }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden access to this service report',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Service report not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ServiceReportsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create new service report' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Service report successfully created',
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid input payload' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized access' }),
    (0, log_activity_decorator_1.LogActivity)({
        action: activity_action_enum_1.ActivityAction.CREATE,
        entityType: 'service_reports',
        description: (ctx) => {
            const report = ctx.result;
            const repNo = report?.report_number || 'N/A';
            const parts = [
                report?.machine_model || ctx.body.machine_model ? `Machine: ${report?.machine_model || ctx.body.machine_model}` : null,
                report?.place || ctx.body.place ? `Place: ${report?.place || ctx.body.place}` : null,
                report?.mill?.name ? `Mill: ${report.mill.name}` : null,
                report?.status ? `Status: ${report.status}` : null,
            ].filter(Boolean).join(', ');
            const who = ctx.user.full_name ? `${ctx.user.full_name} created` : 'Created';
            return `${who} Service Report "${repNo}"` + (parts ? ` — ${parts}` : '');
        },
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_service_report_dto_1.CreateServiceReportDto, Object]),
    __metadata("design:returntype", void 0)
], ServiceReportsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update existing service report' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Service report successfully updated',
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid input payload' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized access' }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden access to edit this service report',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Service report not found' }),
    (0, log_activity_decorator_1.LogActivity)({
        action: activity_action_enum_1.ActivityAction.UPDATE,
        entityType: 'service_reports',
        entityIdParam: 'id',
        description: (ctx) => {
            const before = ctx.result?.before;
            const after = ctx.result?.after;
            const repNo = after?.report_number || before?.report_number || ctx.params.id;
            const diff = before && after ? (0, description_helper_1.buildDiffSummary)(before, after, ctx.body) : '';
            const who = ctx.user.full_name ? `${ctx.user.full_name} updated` : 'Updated';
            return diff
                ? `${who} Service Report "${repNo}" — ${diff}`
                : `${who} Service Report "${repNo}" (no changes detected)`;
        },
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_service_report_dto_1.UpdateServiceReportDto, Object]),
    __metadata("design:returntype", void 0)
], ServiceReportsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Soft delete service report' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Service report successfully deleted',
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized access' }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden access to delete this service report',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Service report not found' }),
    (0, log_activity_decorator_1.LogActivity)({
        action: activity_action_enum_1.ActivityAction.DELETE,
        entityType: 'service_reports',
        entityIdParam: 'id',
        description: (ctx) => {
            const report = ctx.result;
            const repNo = report?.report_number || ctx.params.id;
            return (0, description_helper_1.deleteDescription)('Service Report', repNo, ctx.user.full_name);
        },
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ServiceReportsController.prototype, "remove", null);
exports.ServiceReportsController = ServiceReportsController = __decorate([
    (0, swagger_1.ApiTags)('service-reports'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('service-reports'),
    __metadata("design:paramtypes", [service_reports_service_1.ServiceReportsService])
], ServiceReportsController);
//# sourceMappingURL=service-reports.controller.js.map