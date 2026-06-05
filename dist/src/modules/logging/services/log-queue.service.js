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
var LogQueueService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogQueueService = exports.LogQueue = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
var LogQueue;
(function (LogQueue) {
    LogQueue["ACTIVITY"] = "activity-logs";
    LogQueue["AUDIT"] = "audit-logs";
    LogQueue["SECURITY"] = "security-logs";
    LogQueue["API"] = "api-logs";
    LogQueue["ERROR"] = "error-logs";
    LogQueue["JOB"] = "job-logs";
    LogQueue["NOTIFICATION"] = "notification-logs";
})(LogQueue || (exports.LogQueue = LogQueue = {}));
let LogQueueService = LogQueueService_1 = class LogQueueService {
    activityQueue;
    auditQueue;
    securityQueue;
    apiQueue;
    errorQueue;
    logger = new common_1.Logger(LogQueueService_1.name);
    constructor(activityQueue, auditQueue, securityQueue, apiQueue, errorQueue) {
        this.activityQueue = activityQueue;
        this.auditQueue = auditQueue;
        this.securityQueue = securityQueue;
        this.apiQueue = apiQueue;
        this.errorQueue = errorQueue;
    }
    async addActivityLog(data, options = {}) {
        return this.activityQueue.add('activity-log', data, {
            priority: options.priority ?? 5,
            attempts: options.attempts ?? 3,
            backoff: { type: 'exponential', delay: 1000 },
            removeOnComplete: { age: 3600 },
            removeOnFail: { age: 86400 },
        });
    }
    async addAuditTrail(data, options = {}) {
        return this.auditQueue.add('audit-trail', data, {
            priority: options.priority ?? 10,
            attempts: options.attempts ?? 5,
            backoff: { type: 'fixed', delay: 2000 },
        });
    }
    async addSecurityLog(data, options = {}) {
        return this.securityQueue.add('security-log', data, {
            priority: options.priority ?? 10,
            attempts: options.attempts ?? 5,
            backoff: { type: 'fixed', delay: 1000 },
        });
    }
    async addApiLog(data, options = {}) {
        return this.apiQueue.add('api-log', data, {
            priority: options.priority ?? 1,
            attempts: options.attempts ?? 2,
            removeOnComplete: { count: 1000 },
        });
    }
    async addErrorLog(data, options = {}) {
        return this.errorQueue.add('error-log', data, {
            priority: options.priority ?? 10,
            attempts: options.attempts ?? 5,
            delay: options.delay ?? 500,
        });
    }
    async addBulkActivityLogs(logs) {
        const jobs = logs.map((log) => ({
            name: 'activity-log',
            data: log,
            opts: { priority: 1 },
        }));
        return this.activityQueue.addBulk(jobs);
    }
    async getQueueMetrics() {
        return {
            activity: {
                waiting: await this.activityQueue.getWaitingCount(),
                active: await this.activityQueue.getActiveCount(),
                completed: await this.activityQueue.getCompletedCount(),
                failed: await this.activityQueue.getFailedCount(),
            },
            audit: {
                waiting: await this.auditQueue.getWaitingCount(),
                active: await this.auditQueue.getActiveCount(),
                completed: await this.auditQueue.getCompletedCount(),
                failed: await this.auditQueue.getFailedCount(),
            },
            security: {
                waiting: await this.securityQueue.getWaitingCount(),
                active: await this.securityQueue.getActiveCount(),
                completed: await this.securityQueue.getCompletedCount(),
                failed: await this.securityQueue.getFailedCount(),
            },
        };
    }
};
exports.LogQueueService = LogQueueService;
exports.LogQueueService = LogQueueService = LogQueueService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, bullmq_1.InjectQueue)(LogQueue.ACTIVITY)),
    __param(1, (0, bullmq_1.InjectQueue)(LogQueue.AUDIT)),
    __param(2, (0, bullmq_1.InjectQueue)(LogQueue.SECURITY)),
    __param(3, (0, bullmq_1.InjectQueue)(LogQueue.API)),
    __param(4, (0, bullmq_1.InjectQueue)(LogQueue.ERROR)),
    __metadata("design:paramtypes", [bullmq_2.Queue,
        bullmq_2.Queue,
        bullmq_2.Queue,
        bullmq_2.Queue,
        bullmq_2.Queue])
], LogQueueService);
//# sourceMappingURL=log-queue.service.js.map