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
let ReportsController = class ReportsController {
    reportsService;
    constructor(reportsService) {
        this.reportsService = reportsService;
    }
    async getServices(req, res, skip, take, search, status, categoryId, dateFrom, dateTo, millId, technicianId, exportType) {
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
    async getInstallations(req, res, skip, take, search, status, dateFrom, dateTo, millId, technicianId, exportType) {
        const params = {
            skip: skip ? parseInt(skip, 10) : 0,
            take: take ? parseInt(take, 10) : 10,
            search,
            status,
            dateFrom,
            dateTo,
            millId,
            technicianId,
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
    async getExpenses(req, res, skip, take, search, status, categoryId, dateFrom, dateTo, millId, technicianId, exportType) {
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
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)('services'),
    (0, swagger_1.ApiOperation)({ summary: 'Get service reports log or export it' }),
    (0, swagger_1.ApiQuery)({ name: 'skip', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'take', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'categoryId', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'dateFrom', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'dateTo', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'millId', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'technicianId', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'export', required: false, type: String, description: 'pdf, csv, excel' }),
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
    __param(11, (0, common_1.Query)('export')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getServices", null);
__decorate([
    (0, common_1.Get)('installations'),
    (0, swagger_1.ApiOperation)({ summary: 'Get installation reports log or export it' }),
    (0, swagger_1.ApiQuery)({ name: 'skip', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'take', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'dateFrom', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'dateTo', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'millId', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'technicianId', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'export', required: false, type: String, description: 'pdf, csv, excel' }),
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
    __param(10, (0, common_1.Query)('export')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getInstallations", null);
__decorate([
    (0, common_1.Get)('expenses'),
    (0, swagger_1.ApiOperation)({ summary: 'Get expense reports log or export it' }),
    (0, swagger_1.ApiQuery)({ name: 'skip', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'take', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'categoryId', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'dateFrom', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'dateTo', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'millId', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'technicianId', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'export', required: false, type: String, description: 'pdf, csv, excel' }),
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
    __param(11, (0, common_1.Query)('export')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getExpenses", null);
exports.ReportsController = ReportsController = __decorate([
    (0, swagger_1.ApiTags)('reports'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('reports'),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map