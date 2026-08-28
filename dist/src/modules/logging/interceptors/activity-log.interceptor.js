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
var ActivityLogInterceptor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityLogInterceptor = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const rxjs_1 = require("rxjs");
const activity_log_service_1 = require("../services/activity-log.service");
const log_activity_decorator_1 = require("../../activity-logs/decorators/log-activity.decorator");
let ActivityLogInterceptor = ActivityLogInterceptor_1 = class ActivityLogInterceptor {
    reflector;
    activityLogService;
    logger = new common_1.Logger(ActivityLogInterceptor_1.name);
    constructor(reflector, activityLogService) {
        this.reflector = reflector;
        this.activityLogService = activityLogService;
    }
    intercept(context, next) {
        const options = this.reflector.getAllAndOverride(log_activity_decorator_1.LOG_ACTIVITY_KEY, [context.getHandler(), context.getClass()]);
        if (!options) {
            return next.handle();
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            this.logger.warn(`Activity logging skipped: No user in request`);
            return next.handle();
        }
        const userId = user.id ?? user.userId;
        const ipAddress = this.getClientIp(request);
        const userAgent = request.headers['user-agent'];
        const correlationId = request['correlationId'];
        const requestId = request['requestId'];
        const sessionId = request.cookies?.['session_id'];
        const startTime = Date.now();
        return next.handle().pipe((0, rxjs_1.tap)(async (result) => {
            try {
                if (options.ignoreNullEntity &&
                    (result === null || result === undefined)) {
                    return;
                }
                const logContext = {
                    user: {
                        id: userId,
                        email: user.email,
                        full_name: user.full_name || user.email || user.userId,
                    },
                    body: request.body,
                    params: request.params,
                    query: request.query,
                    result: result,
                    ip_address: ipAddress,
                    user_agent: userAgent,
                    device_name: this.getDeviceName(userAgent),
                };
                let description;
                if (typeof options.description === 'function') {
                    description = await options.description(logContext);
                }
                else {
                    description = options.description;
                }
                let entityId;
                if (options.entityIdParam) {
                    const paramKey = Array.isArray(options.entityIdParam)
                        ? options.entityIdParam[0]
                        : options.entityIdParam;
                    entityId = request.params[paramKey];
                }
                else if (result && typeof result === 'object' && 'id' in result) {
                    entityId = result.id;
                }
                await this.activityLogService.create({
                    userId: userId,
                    action: options.action,
                    entityType: options.entityType,
                    entityId,
                    description,
                    metadata: {
                        execution_time_ms: Date.now() - startTime,
                        method: request.method,
                        path: request.path,
                        body: this.sanitizeBody(request.body),
                    },
                    ipAddress,
                    userAgent,
                    correlationId,
                    requestId,
                    sessionId,
                    executionTimeMs: Date.now() - startTime,
                });
            }
            catch (error) {
                this.logger.error(`Failed to log activity: ${error.message}`, error.stack);
            }
        }));
    }
    getClientIp(request) {
        const forwarded = request.headers['x-forwarded-for'];
        if (forwarded) {
            return (typeof forwarded === 'string' ? forwarded : forwarded[0])
                .split(',')[0]
                .trim();
        }
        return request.ip || request.socket?.remoteAddress;
    }
    getDeviceName(userAgent) {
        if (!userAgent)
            return undefined;
        if (userAgent.includes('Mobile'))
            return 'Mobile';
        if (userAgent.includes('Tablet'))
            return 'Tablet';
        if (userAgent.includes('Windows'))
            return 'Windows';
        if (userAgent.includes('Mac'))
            return 'Mac';
        if (userAgent.includes('Linux'))
            return 'Linux';
        return 'Unknown';
    }
    sanitizeBody(body) {
        if (!body || typeof body !== 'object')
            return body;
        const sanitized = { ...body };
        const sensitiveFields = [
            'password',
            'password_hash',
            'token',
            'refresh_token',
            'secret',
            'credit_card',
        ];
        for (const field of sensitiveFields) {
            if (field in sanitized) {
                sanitized[field] = '***REDACTED***';
            }
        }
        return sanitized;
    }
};
exports.ActivityLogInterceptor = ActivityLogInterceptor;
exports.ActivityLogInterceptor = ActivityLogInterceptor = ActivityLogInterceptor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        activity_log_service_1.ActivityLogService])
], ActivityLogInterceptor);
//# sourceMappingURL=activity-log.interceptor.js.map