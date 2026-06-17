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
exports.MobileServiceReportsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const service_reports_service_1 = require("./service-reports.service");
const create_mobile_service_report_dto_1 = require("./dto/create-mobile-service-report.dto");
const update_mobile_service_report_dto_1 = require("./dto/update-mobile-service-report.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const log_activity_decorator_1 = require("../activity-logs/decorators/log-activity.decorator");
const activity_action_enum_1 = require("../activity-logs/enums/activity-action.enum");
const description_helper_1 = require("../activity-logs/helpers/description.helper");
let MobileServiceReportsController = class MobileServiceReportsController {
    serviceReportsService;
    constructor(serviceReportsService) {
        this.serviceReportsService = serviceReportsService;
    }
    findAll(req, skip, take, search, status, serviceCategoryId, dateFrom, dateTo, startDate, endDate) {
        return this.serviceReportsService.findAll({
            skip: skip ? parseInt(skip, 10) : 0,
            take: take ? parseInt(take, 10) : 10,
            search,
            status,
            serviceCategoryId,
            dateFrom: dateFrom || startDate,
            dateTo: dateTo || endDate,
        }, req.user);
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
    async downloadPdf(id, req, res) {
        const { buffer, fileName } = await this.serviceReportsService.generatePdf(id, req.user);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Length', buffer.length);
        res.end(buffer);
    }
};
exports.MobileServiceReportsController = MobileServiceReportsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: '[Mobile] List service reports assigned to the logged-in engineer',
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
        name: 'serviceCategoryId',
        required: false,
        type: String,
        description: 'Filter by service category UUID',
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
    (0, swagger_1.ApiQuery)({
        name: 'startDate',
        required: false,
        type: String,
        description: 'Alias/fallback for dateFrom — ISO date string `YYYY-MM-DD`',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'endDate',
        required: false,
        type: String,
        description: 'Alias/fallback for dateTo — ISO date string `YYYY-MM-DD`',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Paginated list of service reports',
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid JWT token' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('skip')),
    __param(2, (0, common_1.Query)('take')),
    __param(3, (0, common_1.Query)('search')),
    __param(4, (0, common_1.Query)('status')),
    __param(5, (0, common_1.Query)('serviceCategoryId')),
    __param(6, (0, common_1.Query)('dateFrom')),
    __param(7, (0, common_1.Query)('dateTo')),
    __param(8, (0, common_1.Query)('startDate')),
    __param(9, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], MobileServiceReportsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: '[Mobile] Get a single service report by ID',
        description: 'Service Engineers are blocked with 403 if they are not assigned to the report.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Service report detail' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid JWT token' }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Not assigned to this service report',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Service report not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MobileServiceReportsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({
        summary: '[Mobile] Create a new service report',
        description: "For Service Engineers the logged-in engineer's ID is automatically " +
            'appended to technician_ids even if omitted from the body.',
    }),
    (0, swagger_1.ApiBody)({
        type: create_mobile_service_report_dto_1.CreateMobileServiceReportDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Service report created' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation error' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid JWT token' }),
    (0, log_activity_decorator_1.LogActivity)({
        action: activity_action_enum_1.ActivityAction.CREATE,
        entityType: 'service_reports',
        description: (ctx) => {
            const report = ctx.result;
            const repNo = report?.report_number || 'N/A';
            const parts = [
                report?.machine_model || ctx.body.machine_model
                    ? `Machine: ${report?.machine_model || ctx.body.machine_model}`
                    : null,
                report?.place || ctx.body.place
                    ? `Place: ${report?.place || ctx.body.place}`
                    : null,
                report?.mill?.name ? `Mill: ${report.mill.name}` : null,
                report?.status ? `Status: ${report.status}` : null,
            ]
                .filter(Boolean)
                .join(', ');
            const who = ctx.user.full_name
                ? `${ctx.user.full_name} created`
                : 'Created';
            return `${who} Service Report "${repNo}"` + (parts ? ` — ${parts}` : '');
        },
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_mobile_service_report_dto_1.CreateMobileServiceReportDto, Object]),
    __metadata("design:returntype", void 0)
], MobileServiceReportsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: '[Mobile] Update an existing service report',
        description: 'Service Engineers can only update reports they are assigned to.',
    }),
    (0, swagger_1.ApiBody)({
        type: update_mobile_service_report_dto_1.UpdateMobileServiceReportDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Service report updated' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation error' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid JWT token' }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Not assigned to this service report',
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
            const who = ctx.user.full_name
                ? `${ctx.user.full_name} updated`
                : 'Updated';
            return diff
                ? `${who} Service Report "${repNo}" — ${diff}`
                : `${who} Service Report "${repNo}" (no changes detected)`;
        },
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_mobile_service_report_dto_1.UpdateMobileServiceReportDto, Object]),
    __metadata("design:returntype", void 0)
], MobileServiceReportsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: '[Mobile] Soft-delete a service report',
        description: 'Service Engineers can only delete reports they are assigned to.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Service report soft-deleted' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid JWT token' }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Not assigned to this service report',
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
], MobileServiceReportsController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(':id/pdf'),
    (0, swagger_1.ApiOperation)({
        summary: '[Mobile] Download service report as PDF',
        description: 'Service Engineers can only download PDFs for reports they are assigned to.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'PDF file stream' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid JWT token' }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Not assigned to this service report',
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
], MobileServiceReportsController.prototype, "downloadPdf", null);
exports.MobileServiceReportsController = MobileServiceReportsController = __decorate([
    (0, swagger_1.ApiTags)('mobile / service-reports'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('mobile/service-reports'),
    __metadata("design:paramtypes", [service_reports_service_1.ServiceReportsService])
], MobileServiceReportsController);
//# sourceMappingURL=mobile-service-reports.controller.js.map