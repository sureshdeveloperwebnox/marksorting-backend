"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingModule = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const log_queue_service_1 = require("./services/log-queue.service");
const activity_log_service_1 = require("./services/activity-log.service");
const security_log_service_1 = require("./services/security-log.service");
const activity_log_processor_1 = require("./processors/activity-log.processor");
const activity_log_interceptor_1 = require("./interceptors/activity-log.interceptor");
const correlation_id_middleware_1 = require("./middleware/correlation-id.middleware");
const request_logger_middleware_1 = require("./middleware/request-logger.middleware");
const redis_module_1 = require("../../redis/redis.module");
const prisma_module_1 = require("../../prisma/prisma.module");
let LoggingModule = class LoggingModule {
};
exports.LoggingModule = LoggingModule;
exports.LoggingModule = LoggingModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [
            bullmq_1.BullModule.registerQueue({ name: log_queue_service_1.LogQueue.ACTIVITY }, { name: log_queue_service_1.LogQueue.AUDIT }, { name: log_queue_service_1.LogQueue.SECURITY }, { name: log_queue_service_1.LogQueue.API }, { name: log_queue_service_1.LogQueue.ERROR }),
            redis_module_1.RedisModule,
            prisma_module_1.PrismaModule,
        ],
        providers: [
            log_queue_service_1.LogQueueService,
            activity_log_service_1.ActivityLogService,
            security_log_service_1.SecurityLogService,
            activity_log_processor_1.ActivityLogProcessor,
            activity_log_interceptor_1.ActivityLogInterceptor,
            correlation_id_middleware_1.CorrelationIdMiddleware,
            request_logger_middleware_1.RequestLoggerMiddleware,
        ],
        exports: [
            log_queue_service_1.LogQueueService,
            activity_log_service_1.ActivityLogService,
            security_log_service_1.SecurityLogService,
            activity_log_interceptor_1.ActivityLogInterceptor,
            correlation_id_middleware_1.CorrelationIdMiddleware,
            request_logger_middleware_1.RequestLoggerMiddleware,
        ],
    })
], LoggingModule);
//# sourceMappingURL=logging.module.js.map