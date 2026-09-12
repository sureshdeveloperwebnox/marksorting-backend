"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const bullmq_1 = require("@nestjs/bullmq");
const event_emitter_1 = require("@nestjs/event-emitter");
const nestjs_pino_1 = require("nestjs-pino");
const configuration_1 = __importDefault(require("./config/configuration"));
const validation_1 = require("./config/validation");
const prisma_module_1 = require("./prisma/prisma.module");
const redis_module_1 = require("./redis/redis.module");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const roles_module_1 = require("./modules/roles/roles.module");
const mills_module_1 = require("./modules/mills/mills.module");
const master_mills_module_1 = require("./modules/master-mills/master-mills.module");
const service_categories_module_1 = require("./modules/service-categories/service-categories.module");
const service_reports_module_1 = require("./modules/service-reports/service-reports.module");
const installation_reports_module_1 = require("./modules/installation-reports/installation-reports.module");
const expenses_module_1 = require("./modules/expenses/expenses.module");
const expense_categories_module_1 = require("./modules/expense-categories/expense-categories.module");
const customers_module_1 = require("./modules/customers/customers.module");
const shared_module_1 = require("./shared/shared.module");
const upload_module_1 = require("./modules/upload/upload.module");
const technicians_module_1 = require("./modules/technicians/technicians.module");
const tickets_module_1 = require("./modules/tickets/tickets.module");
const settings_module_1 = require("./modules/settings/settings.module");
const dashboard_module_1 = require("./modules/dashboard/dashboard.module");
const reports_module_1 = require("./modules/reports/reports.module");
const materials_module_1 = require("./modules/materials/materials.module");
const stores_module_1 = require("./modules/stores/stores.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const mail_module_1 = require("./modules/mail/mail.module");
const whatsapp_module_1 = require("./modules/whatsapp/whatsapp.module");
const report_notifications_module_1 = require("./modules/report-notifications/report-notifications.module");
const permissions_module_1 = require("./modules/permissions/permissions.module");
const activity_logs_module_1 = require("./modules/activity-logs/activity-logs.module");
const activity_log_interceptor_1 = require("./modules/activity-logs/interceptors/activity-log.interceptor");
const auto_activity_log_interceptor_1 = require("./modules/activity-logs/interceptors/auto-activity-log.interceptor");
const jwt_auth_guard_1 = require("./common/guards/jwt-auth.guard");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [configuration_1.default],
                validationSchema: validation_1.validationSchema,
            }),
            nestjs_pino_1.LoggerModule.forRoot({
                pinoHttp: {
                    safe: true,
                    transport: process.env.NODE_ENV !== 'production'
                        ? { target: 'pino-pretty' }
                        : undefined,
                },
            }),
            bullmq_1.BullModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: async (configService) => ({
                    connection: {
                        host: configService.get('redis.host') || 'localhost',
                        port: configService.get('redis.port') || 6379,
                        password: configService.get('redis.password'),
                    },
                }),
                inject: [config_1.ConfigService],
            }),
            event_emitter_1.EventEmitterModule.forRoot(),
            prisma_module_1.PrismaModule,
            redis_module_1.RedisModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            roles_module_1.RolesModule,
            mills_module_1.MillsModule,
            master_mills_module_1.MasterMillsModule,
            service_categories_module_1.ServiceCategoriesModule,
            service_reports_module_1.ServiceReportsModule,
            installation_reports_module_1.InstallationReportsModule,
            expenses_module_1.ExpensesModule,
            expense_categories_module_1.ExpenseCategoriesModule,
            customers_module_1.CustomersModule,
            shared_module_1.SharedModule,
            upload_module_1.UploadModule,
            technicians_module_1.TechniciansModule,
            tickets_module_1.TicketsModule,
            settings_module_1.SettingsModule,
            dashboard_module_1.DashboardModule,
            reports_module_1.ReportsModule,
            materials_module_1.MaterialsModule,
            stores_module_1.StoresModule,
            notifications_module_1.NotificationsModule,
            mail_module_1.MailModule,
            whatsapp_module_1.WhatsAppModule,
            report_notifications_module_1.ReportNotificationsModule,
            permissions_module_1.PermissionsModule,
            activity_logs_module_1.ActivityLogsModule,
        ],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: jwt_auth_guard_1.JwtAuthGuard,
            },
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: activity_log_interceptor_1.ActivityLogInterceptor,
            },
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: auto_activity_log_interceptor_1.AutoActivityLogInterceptor,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map