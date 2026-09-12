"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportNotificationsModule = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const prisma_module_1 = require("../../prisma/prisma.module");
const whatsapp_module_1 = require("../whatsapp/whatsapp.module");
const mail_module_1 = require("../mail/mail.module");
const service_reports_module_1 = require("../service-reports/service-reports.module");
const installation_reports_module_1 = require("../installation-reports/installation-reports.module");
const report_notifications_service_1 = require("./report-notifications.service");
const report_notifications_event_listener_1 = require("./report-notifications.event-listener");
const report_notifications_controller_1 = require("./report-notifications.controller");
let ReportNotificationsModule = class ReportNotificationsModule {
};
exports.ReportNotificationsModule = ReportNotificationsModule;
exports.ReportNotificationsModule = ReportNotificationsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            whatsapp_module_1.WhatsAppModule,
            mail_module_1.MailModule,
            service_reports_module_1.ServiceReportsModule,
            installation_reports_module_1.InstallationReportsModule,
            bullmq_1.BullModule.registerQueue({
                name: 'report-notifications',
                defaultJobOptions: {
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 5000,
                    },
                    removeOnComplete: {
                        age: 86400,
                        count: 500,
                    },
                    removeOnFail: {
                        age: 604800,
                        count: 200,
                    },
                },
            }),
            bullmq_1.BullModule.registerQueue({
                name: 'mail',
            }),
        ],
        controllers: [report_notifications_controller_1.ReportNotificationsController],
        providers: [report_notifications_service_1.ReportNotificationsService, report_notifications_event_listener_1.ReportNotificationsEventListener],
        exports: [report_notifications_service_1.ReportNotificationsService],
    })
], ReportNotificationsModule);
//# sourceMappingURL=report-notifications.module.js.map