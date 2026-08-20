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
var ActivityLogProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityLogProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const log_queue_service_1 = require("../services/log-queue.service");
const redis_service_1 = require("../../../redis/redis.service");
let ActivityLogProcessor = ActivityLogProcessor_1 = class ActivityLogProcessor extends bullmq_1.WorkerHost {
    prisma;
    redis;
    logger = new common_1.Logger(ActivityLogProcessor_1.name);
    BATCH_SIZE = 100;
    batchBuffer = [];
    flushInterval;
    constructor(prisma, redis) {
        super();
        this.prisma = prisma;
        this.redis = redis;
        this.flushInterval = setInterval(() => this.flushBuffer(), 5000);
    }
    async process(job) {
        try {
            const logData = job.data;
            this.batchBuffer.push({
                user_id: logData.userId,
                action: logData.action,
                entity_type: logData.entityType,
                entity_id: logData.entityId,
                description: logData.description,
                metadata: logData.metadata,
                ip_address: logData.ipAddress,
                user_agent: logData.userAgent,
                device_name: logData.deviceName,
                browser: logData.browser,
                os: logData.os,
                correlation_id: logData.correlationId,
                request_id: logData.requestId,
                session_id: logData.sessionId,
                execution_time_ms: logData.executionTimeMs,
                created_at: new Date(),
            });
            if (this.batchBuffer.length >= this.BATCH_SIZE) {
                await this.flushBuffer();
            }
            await this.redis.publish('activity-logs', JSON.stringify({
                type: 'NEW_ACTIVITY_LOG',
                data: logData,
                timestamp: new Date().toISOString(),
            }));
            return { success: true, buffered: this.batchBuffer.length };
        }
        catch (error) {
            this.logger.error(`Failed to process activity log: ${error.message}`, error.stack);
            throw error;
        }
    }
    async flushBuffer() {
        if (this.batchBuffer.length === 0)
            return;
        const logs = [...this.batchBuffer];
        this.batchBuffer = [];
        try {
            await this.prisma.$transaction(async (tx) => {
                await tx.activityLog.createMany({
                    data: logs,
                    skipDuplicates: true,
                });
            });
            this.logger.debug(`Flushed ${logs.length} activity logs to database`);
        }
        catch (error) {
            this.logger.error(`Failed to flush activity logs: ${error.message}`);
            this.batchBuffer.unshift(...logs);
        }
    }
    onCompleted(job) {
        this.logger.debug(`Activity log job ${job.id} completed`);
    }
    onFailed(job, error) {
        this.logger.error(`Activity log job ${job.id} failed: ${error.message}`);
    }
    async onModuleDestroy() {
        clearInterval(this.flushInterval);
        await this.flushBuffer();
    }
};
exports.ActivityLogProcessor = ActivityLogProcessor;
__decorate([
    (0, bullmq_1.OnWorkerEvent)('completed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bullmq_2.Job]),
    __metadata("design:returntype", void 0)
], ActivityLogProcessor.prototype, "onCompleted", null);
__decorate([
    (0, bullmq_1.OnWorkerEvent)('failed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bullmq_2.Job, Error]),
    __metadata("design:returntype", void 0)
], ActivityLogProcessor.prototype, "onFailed", null);
exports.ActivityLogProcessor = ActivityLogProcessor = ActivityLogProcessor_1 = __decorate([
    (0, bullmq_1.Processor)(log_queue_service_1.LogQueue.ACTIVITY, {
        concurrency: 10,
        lockDuration: 30000,
    }),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], ActivityLogProcessor);
//# sourceMappingURL=activity-log.processor.js.map