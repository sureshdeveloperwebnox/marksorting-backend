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
let ServiceReportsController = class ServiceReportsController {
    serviceReportsService;
    constructor(serviceReportsService) {
        this.serviceReportsService = serviceReportsService;
    }
    findAll(skip, take, search, status, serviceCategoryId, dateFrom, dateTo) {
        return this.serviceReportsService.findAll({
            skip: skip ? parseInt(skip, 10) : 0,
            take: take ? parseInt(take, 10) : 10,
            search,
            status,
            serviceCategoryId,
            dateFrom,
            dateTo,
        });
    }
    async downloadPdf(id, res) {
        const { buffer, fileName } = await this.serviceReportsService.generatePdf(id);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Length', buffer.length);
        res.end(buffer);
    }
    findOne(id) {
        return this.serviceReportsService.findById(id);
    }
    create(dto) {
        return this.serviceReportsService.create(dto);
    }
    update(id, dto) {
        return this.serviceReportsService.update(id, dto);
    }
    remove(id) {
        return this.serviceReportsService.remove(id);
    }
};
exports.ServiceReportsController = ServiceReportsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get all service reports with pagination and filtering',
    }),
    __param(0, (0, common_1.Query)('skip')),
    __param(1, (0, common_1.Query)('take')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('status')),
    __param(4, (0, common_1.Query)('serviceCategoryId')),
    __param(5, (0, common_1.Query)('dateFrom')),
    __param(6, (0, common_1.Query)('dateTo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], ServiceReportsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id/pdf'),
    (0, swagger_1.ApiOperation)({ summary: 'Download service report PDF' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ServiceReportsController.prototype, "downloadPdf", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get service report by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ServiceReportsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create new service report' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_service_report_dto_1.CreateServiceReportDto]),
    __metadata("design:returntype", void 0)
], ServiceReportsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update existing service report' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_service_report_dto_1.UpdateServiceReportDto]),
    __metadata("design:returntype", void 0)
], ServiceReportsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Soft delete service report' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ServiceReportsController.prototype, "remove", null);
exports.ServiceReportsController = ServiceReportsController = __decorate([
    (0, swagger_1.ApiTags)('service-reports'),
    (0, common_1.Controller)('service-reports'),
    __metadata("design:paramtypes", [service_reports_service_1.ServiceReportsService])
], ServiceReportsController);
//# sourceMappingURL=service-reports.controller.js.map