"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceReportsModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../../prisma/prisma.module");
const redis_module_1 = require("../../redis/redis.module");
const pdf_module_1 = require("../pdf/pdf.module");
const settings_module_1 = require("../settings/settings.module");
const service_reports_service_1 = require("./service-reports.service");
const service_reports_controller_1 = require("./service-reports.controller");
const mobile_service_reports_controller_1 = require("./mobile-service-reports.controller");
let ServiceReportsModule = class ServiceReportsModule {
};
exports.ServiceReportsModule = ServiceReportsModule;
exports.ServiceReportsModule = ServiceReportsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, redis_module_1.RedisModule, pdf_module_1.PdfModule, settings_module_1.SettingsModule],
        controllers: [service_reports_controller_1.ServiceReportsController, mobile_service_reports_controller_1.MobileServiceReportsController],
        providers: [service_reports_service_1.ServiceReportsService],
        exports: [service_reports_service_1.ServiceReportsService],
    })
], ServiceReportsModule);
//# sourceMappingURL=service-reports.module.js.map