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
exports.ActivityLogsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const activity_logs_service_1 = require("./activity-logs.service");
const query_activity_logs_dto_1 = require("./dto/query-activity-logs.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
let ActivityLogsController = class ActivityLogsController {
    activityLogsService;
    constructor(activityLogsService) {
        this.activityLogsService = activityLogsService;
    }
    findAll(dto) {
        return this.activityLogsService.findAll(dto);
    }
    async getStats(startDate, endDate) {
        return this.activityLogsService.getStats(startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
    }
    getUserActivity(userId, limit) {
        return this.activityLogsService.getUserActivity(userId, limit ? parseInt(limit) : 100);
    }
    getEntityActivity(entityType, entityId, limit) {
        return this.activityLogsService.getEntityActivity(entityType, entityId, limit ? parseInt(limit) : 100);
    }
    async exportToExcel(dto, res) {
        const buffer = await this.activityLogsService.exportToExcel(dto);
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const filename = `activity_logs_${dateStr}.xlsx`;
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', buffer.length);
        res.send(buffer);
    }
};
exports.ActivityLogsController = ActivityLogsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get all activity logs with filtering and pagination',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Activity logs retrieved successfully',
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_activity_logs_dto_1.QueryActivityLogsDto]),
    __metadata("design:returntype", void 0)
], ActivityLogsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get activity log statistics' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Statistics retrieved successfully',
    }),
    __param(0, (0, common_1.Query)('start_date')),
    __param(1, (0, common_1.Query)('end_date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ActivityLogsController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get activity logs for specific user' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'User activity retrieved successfully',
    }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ActivityLogsController.prototype, "getUserActivity", null);
__decorate([
    (0, common_1.Get)('entity/:entityType/:entityId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get activity logs for specific entity' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Entity activity retrieved successfully',
    }),
    __param(0, (0, common_1.Param)('entityType')),
    __param(1, (0, common_1.Param)('entityId')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], ActivityLogsController.prototype, "getEntityActivity", null);
__decorate([
    (0, common_1.Get)('export/excel'),
    (0, swagger_1.ApiOperation)({ summary: 'Export activity logs to Excel' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Excel file downloaded successfully',
    }),
    (0, common_1.Header)('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_activity_logs_dto_1.QueryActivityLogsDto, Object]),
    __metadata("design:returntype", Promise)
], ActivityLogsController.prototype, "exportToExcel", null);
exports.ActivityLogsController = ActivityLogsController = __decorate([
    (0, swagger_1.ApiTags)('activity-logs'),
    (0, common_1.Controller)('activity-logs'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [activity_logs_service_1.ActivityLogsService])
], ActivityLogsController);
//# sourceMappingURL=activity-logs.controller.js.map