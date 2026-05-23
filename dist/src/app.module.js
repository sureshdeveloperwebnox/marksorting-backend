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
const config_1 = require("@nestjs/config");
const bullmq_1 = require("@nestjs/bullmq");
const nestjs_pino_1 = require("nestjs-pino");
const configuration_1 = __importDefault(require("./config/configuration"));
const validation_1 = require("./config/validation");
const prisma_module_1 = require("./prisma/prisma.module");
const redis_module_1 = require("./redis/redis.module");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const roles_module_1 = require("./modules/roles/roles.module");
const mills_module_1 = require("./modules/mills/mills.module");
const service_categories_module_1 = require("./modules/service-categories/service-categories.module");
const service_reports_module_1 = require("./modules/service-reports/service-reports.module");
const installation_reports_module_1 = require("./modules/installation-reports/installation-reports.module");
const expenses_module_1 = require("./modules/expenses/expenses.module");
const customers_module_1 = require("./modules/customers/customers.module");
const shared_module_1 = require("./shared/shared.module");
const upload_module_1 = require("./modules/upload/upload.module");
const technicians_module_1 = require("./modules/technicians/technicians.module");
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
                    transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
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
            prisma_module_1.PrismaModule,
            redis_module_1.RedisModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            roles_module_1.RolesModule,
            mills_module_1.MillsModule,
            service_categories_module_1.ServiceCategoriesModule,
            service_reports_module_1.ServiceReportsModule,
            installation_reports_module_1.InstallationReportsModule,
            expenses_module_1.ExpensesModule,
            customers_module_1.CustomersModule,
            shared_module_1.SharedModule,
            upload_module_1.UploadModule,
            technicians_module_1.TechniciansModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map