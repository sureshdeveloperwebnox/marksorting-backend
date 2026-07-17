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
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const reports_service_1 = require("./reports.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const log_activity_decorator_1 = require("../activity-logs/decorators/log-activity.decorator");
const activity_action_enum_1 = require("../activity-logs/enums/activity-action.enum");
let ReportsController = class ReportsController {
    reportsService;
    constructor(reportsService) {
        this.reportsService = reportsService;
    }
    async getFilterOptions(type) {
        return this.reportsService.getFilterOptions(type);
    }
    async getServices(req, res, skip, take, search, status, categoryId, dateFrom, dateTo, millId, technicianId, millName, frameNo, refNo, exportType) {
        const params = {
            skip: skip ? parseInt(skip, 10) : 0,
            take: take ? parseInt(take, 10) : 10,
            search,
            status,
            categoryId,
            dateFrom,
            dateTo,
            millId,
            technicianId,
            millName,
            frameNo,
            refNo,
        };
        if (exportType) {
            const { buffer, fileName, contentType } = await this.reportsService.exportServices(params, req.user, exportType);
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            res.setHeader('Content-Length', buffer.length);
            return res.end(buffer);
        }
        const data = await this.reportsService.getServices(params, req.user);
        return res.json(data);
    }
    async getInstallations(req, res, skip, take, search, status, dateFrom, dateTo, millId, technicianId, millName, frameNo, refNo, exportType) {
        const params = {
            skip: skip ? parseInt(skip, 10) : 0,
            take: take ? parseInt(take, 10) : 10,
            search,
            status,
            dateFrom,
            dateTo,
            millId,
            technicianId,
            millName,
            frameNo,
            refNo,
        };
        if (exportType) {
            const { buffer, fileName, contentType } = await this.reportsService.exportInstallations(params, req.user, exportType);
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            res.setHeader('Content-Length', buffer.length);
            return res.end(buffer);
        }
        const data = await this.reportsService.getInstallations(params, req.user);
        return res.json(data);
    }
    async getExpenses(req, res, skip, take, search, status, categoryId, dateFrom, dateTo, millId, technicianId, millName, frameNo, refNo, exportType) {
        const params = {
            skip: skip ? parseInt(skip, 10) : 0,
            take: take ? parseInt(take, 10) : 10,
            search,
            status,
            categoryId,
            dateFrom,
            dateTo,
            millId,
            technicianId,
            millName,
            frameNo,
            refNo,
        };
        if (exportType) {
            const { buffer, fileName, contentType } = await this.reportsService.exportExpenses(params, req.user, exportType);
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            res.setHeader('Content-Length', buffer.length);
            return res.end(buffer);
        }
        const data = await this.reportsService.getExpenses(params, req.user);
        return res.json(data);
    }
    async getMasterMills(req, res, skip, take, search, status, dateFrom, dateTo, millId, millName, frameNo, refNo, exportType) {
        const params = {
            skip: skip ? parseInt(skip, 10) : 0,
            take: take ? parseInt(take, 10) : 10,
            search,
            status,
            dateFrom,
            dateTo,
            millId,
            millName,
            frameNo,
            refNo,
        };
        if (exportType) {
            const { buffer, fileName, contentType } = await this.reportsService.exportMasterMills(params, req.user, exportType);
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            res.setHeader('Content-Length', buffer.length);
            return res.end(buffer);
        }
        const data = await this.reportsService.getMasterMills(params, req.user);
        return res.json(data);
    }
    async getStores(req, res, skip, take, search, serviceEngineerId, customerId, materialId, warrantyStatus, returnStatus, inflowStatus, dateFrom, dateTo, exportType) {
        const params = {
            skip: skip ? parseInt(skip, 10) : 0,
            take: take ? parseInt(take, 10) : 10,
            search,
            serviceEngineerId,
            customerId,
            materialId,
            warrantyStatus,
            returnStatus,
            inflowStatus,
            dateFrom,
            dateTo,
        };
        if (exportType) {
            const resData = await this.reportsService.exportStores(params, req.user, exportType);
            if (resData) {
                const { buffer, fileName, contentType } = resData;
                res.setHeader('Content-Type', contentType);
                res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
                res.setHeader('Content-Length', buffer.length);
                return res.end(buffer);
            }
            return res.status(400).json({ message: 'Failed to export store reports' });
        }
        const data = await this.reportsService.getStores(params, req.user);
        return res.json(data);
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)('filter-options'),
    (0, swagger_1.ApiOperation)({ summary: 'Get distinct Ref No and Frame No values for filter dropdowns' }),
    (0, swagger_1.ApiQuery)({ name: 'type', required: false, type: String, description: 'services | installations | expenses | master-mills' }),
    __param(0, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getFilterOptions", null);
__decorate([
    (0, common_1.Get)('services'),
    (0, swagger_1.ApiOperation)({ summary: 'Get service reports log or export it' }),
    (0, log_activity_decorator_1.LogActivity)({
        action: activity_action_enum_1.ActivityAction.EXPORT,
        entityType: 'reports',
        description: (ctx) => {
            const exportType = ctx.query.export;
            return exportType
                ? `Exported service reports as ${exportType.toUpperCase()}`
                : 'Viewed service reports list';
        },
        ignoreNullEntity: true,
    }),
    (0, swagger_1.ApiQuery)({ name: 'skip', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'take', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'categoryId', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'dateFrom', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'dateTo', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'millId', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'technicianId', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'millName', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'frameNo', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'refNo', required: false, type: String }),
    (0, swagger_1.ApiQuery)({
        name: 'export',
        required: false,
        type: String,
        description: 'pdf, csv, excel',
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Query)('skip')),
    __param(3, (0, common_1.Query)('take')),
    __param(4, (0, common_1.Query)('search')),
    __param(5, (0, common_1.Query)('status')),
    __param(6, (0, common_1.Query)('categoryId')),
    __param(7, (0, common_1.Query)('dateFrom')),
    __param(8, (0, common_1.Query)('dateTo')),
    __param(9, (0, common_1.Query)('millId')),
    __param(10, (0, common_1.Query)('technicianId')),
    __param(11, (0, common_1.Query)('millName')),
    __param(12, (0, common_1.Query)('frameNo')),
    __param(13, (0, common_1.Query)('refNo')),
    __param(14, (0, common_1.Query)('export')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, String, String, String, String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getServices", null);
__decorate([
    (0, common_1.Get)('installations'),
    (0, swagger_1.ApiOperation)({ summary: 'Get installation reports log or export it' }),
    (0, log_activity_decorator_1.LogActivity)({
        action: activity_action_enum_1.ActivityAction.EXPORT,
        entityType: 'reports',
        description: (ctx) => {
            const exportType = ctx.query.export;
            return exportType
                ? `Exported installation reports as ${exportType.toUpperCase()}`
                : 'Viewed installation reports list';
        },
        ignoreNullEntity: true,
    }),
    (0, swagger_1.ApiQuery)({ name: 'skip', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'take', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'dateFrom', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'dateTo', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'millId', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'technicianId', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'millName', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'frameNo', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'refNo', required: false, type: String }),
    (0, swagger_1.ApiQuery)({
        name: 'export',
        required: false,
        type: String,
        description: 'pdf, csv, excel',
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Query)('skip')),
    __param(3, (0, common_1.Query)('take')),
    __param(4, (0, common_1.Query)('search')),
    __param(5, (0, common_1.Query)('status')),
    __param(6, (0, common_1.Query)('dateFrom')),
    __param(7, (0, common_1.Query)('dateTo')),
    __param(8, (0, common_1.Query)('millId')),
    __param(9, (0, common_1.Query)('technicianId')),
    __param(10, (0, common_1.Query)('millName')),
    __param(11, (0, common_1.Query)('frameNo')),
    __param(12, (0, common_1.Query)('refNo')),
    __param(13, (0, common_1.Query)('export')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, String, String, String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getInstallations", null);
__decorate([
    (0, common_1.Get)('expenses'),
    (0, swagger_1.ApiOperation)({ summary: 'Get expense reports log or export it' }),
    (0, log_activity_decorator_1.LogActivity)({
        action: activity_action_enum_1.ActivityAction.EXPORT,
        entityType: 'reports',
        description: (ctx) => {
            const exportType = ctx.query.export;
            return exportType
                ? `Exported expense reports as ${exportType.toUpperCase()}`
                : 'Viewed expense reports list';
        },
        ignoreNullEntity: true,
    }),
    (0, swagger_1.ApiQuery)({ name: 'skip', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'take', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'categoryId', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'dateFrom', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'dateTo', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'millId', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'technicianId', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'millName', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'frameNo', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'refNo', required: false, type: String }),
    (0, swagger_1.ApiQuery)({
        name: 'export',
        required: false,
        type: String,
        description: 'pdf, csv, excel',
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Query)('skip')),
    __param(3, (0, common_1.Query)('take')),
    __param(4, (0, common_1.Query)('search')),
    __param(5, (0, common_1.Query)('status')),
    __param(6, (0, common_1.Query)('categoryId')),
    __param(7, (0, common_1.Query)('dateFrom')),
    __param(8, (0, common_1.Query)('dateTo')),
    __param(9, (0, common_1.Query)('millId')),
    __param(10, (0, common_1.Query)('technicianId')),
    __param(11, (0, common_1.Query)('millName')),
    __param(12, (0, common_1.Query)('frameNo')),
    __param(13, (0, common_1.Query)('refNo')),
    __param(14, (0, common_1.Query)('export')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, String, String, String, String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getExpenses", null);
__decorate([
    (0, common_1.Get)('master-mills'),
    (0, swagger_1.ApiOperation)({ summary: 'Get master mills reports log or export it' }),
    (0, log_activity_decorator_1.LogActivity)({
        action: activity_action_enum_1.ActivityAction.EXPORT,
        entityType: 'reports',
        description: (ctx) => {
            const exportType = ctx.query.export;
            return exportType
                ? `Exported master mills reports as ${exportType.toUpperCase()}`
                : 'Viewed master mills reports list';
        },
        ignoreNullEntity: true,
    }),
    (0, swagger_1.ApiQuery)({ name: 'skip', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'take', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'dateFrom', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'dateTo', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'millId', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'millName', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'frameNo', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'refNo', required: false, type: String }),
    (0, swagger_1.ApiQuery)({
        name: 'export',
        required: false,
        type: String,
        description: 'pdf, csv, excel',
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Query)('skip')),
    __param(3, (0, common_1.Query)('take')),
    __param(4, (0, common_1.Query)('search')),
    __param(5, (0, common_1.Query)('status')),
    __param(6, (0, common_1.Query)('dateFrom')),
    __param(7, (0, common_1.Query)('dateTo')),
    __param(8, (0, common_1.Query)('millId')),
    __param(9, (0, common_1.Query)('millName')),
    __param(10, (0, common_1.Query)('frameNo')),
    __param(11, (0, common_1.Query)('refNo')),
    __param(12, (0, common_1.Query)('export')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, String, String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getMasterMills", null);
__decorate([
    (0, common_1.Get)('stores'),
    (0, swagger_1.ApiOperation)({ summary: 'Get store reports log or export it' }),
    (0, log_activity_decorator_1.LogActivity)({
        action: activity_action_enum_1.ActivityAction.EXPORT,
        entityType: 'reports',
        description: (ctx) => {
            const exportType = ctx.query.export;
            return exportType
                ? `Exported store reports as ${exportType.toUpperCase()}`
                : 'Viewed store reports list';
        },
        ignoreNullEntity: true,
    }),
    (0, swagger_1.ApiQuery)({ name: 'skip', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'take', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'serviceEngineerId', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'customerId', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'materialId', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'warrantyStatus', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'returnStatus', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'inflowStatus', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'dateFrom', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'dateTo', required: false, type: String }),
    (0, swagger_1.ApiQuery)({
        name: 'export',
        required: false,
        type: String,
        description: 'pdf, csv, excel',
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Query)('skip')),
    __param(3, (0, common_1.Query)('take')),
    __param(4, (0, common_1.Query)('search')),
    __param(5, (0, common_1.Query)('serviceEngineerId')),
    __param(6, (0, common_1.Query)('customerId')),
    __param(7, (0, common_1.Query)('materialId')),
    __param(8, (0, common_1.Query)('warrantyStatus')),
    __param(9, (0, common_1.Query)('returnStatus')),
    __param(10, (0, common_1.Query)('inflowStatus')),
    __param(11, (0, common_1.Query)('dateFrom')),
    __param(12, (0, common_1.Query)('dateTo')),
    __param(13, (0, common_1.Query)('export')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, String, String, String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getStores", null);
exports.ReportsController = ReportsController = __decorate([
    (0, swagger_1.ApiTags)('reports'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('reports'),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map