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
const activity_logs_service_1 = require("../activity-logs.service");
const log_activity_decorator_1 = require("../decorators/log-activity.decorator");
let ActivityLogInterceptor = ActivityLogInterceptor_1 = class ActivityLogInterceptor {
    reflector;
    activityLogsService;
    logger = new common_1.Logger(ActivityLogInterceptor_1.name);
    constructor(reflector, activityLogsService) {
        this.reflector = reflector;
        this.activityLogsService = activityLogsService;
        console.log('>>> ActivityLogInterceptor CONSTRUCTOR CALLED - Interceptor registered!');
    }
    intercept(context, next) {
        console.log('[ActivityLogInterceptor] intercept() called - START');
        const request = context.switchToHttp().getRequest();
        console.log(`[INTERCEPTOR] ${request?.method} ${request?.path} - Checking for @LogActivity...`);
        const options = this.reflector.getAllAndOverride(log_activity_decorator_1.LOG_ACTIVITY_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!options) {
            console.log(`[INTERCEPTOR] ${request.method} ${request.path} - No @LogActivity decorator found`);
            return next.handle();
        }
        const user = request.user;
        console.log(`[ActivityLogInterceptor] ${request.method} ${request.path} - @LogActivity found`);
        if (!user) {
            this.logger.warn(`Activity logging SKIPPED for ${request.method} ${request.path}: No user in request`);
            return next.handle();
        }
        const userId = user.id ?? user.userId;
        const ipAddress = this.getClientIp(request);
        const userAgent = request.headers['user-agent'];
        const deviceName = this.getDeviceName(userAgent);
        const startTime = Date.now();
        return next.handle().pipe((0, rxjs_1.tap)(async (result) => {
            try {
                if (options.ignoreNullEntity && (result === null || result === undefined)) {
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
                    device_name: deviceName,
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
                    const paramValue = request.params[options.entityIdParam];
                    if (paramValue) {
                        entityId = Array.isArray(paramValue) ? paramValue[0] : paramValue;
                    }
                }
                else if (result && typeof result === 'object' && 'id' in result) {
                    entityId = result.id;
                }
                const log = await this.activityLogsService.create({
                    user_id: userId,
                    action: options.action,
                    entity_type: options.entityType,
                    entity_id: entityId,
                    description,
                    metadata: {
                        execution_time_ms: Date.now() - startTime,
                        method: request.method,
                        path: request.path,
                        body: this.sanitizeBody(request.body),
                        result: this.sanitizeResult(result),
                    },
                    ip_address: ipAddress,
                    user_agent: userAgent,
                    device_name: deviceName,
                });
                console.log(`[ActivityLogInterceptor] LOG CREATED: ${log?.id || 'FAILED'} - ${description}`);
            }
            catch (error) {
                this.logger.error(`Failed to log activity: ${error.message}`, error.stack);
            }
        }));
    }
    getClientIp(request) {
        const forwarded = request.headers['x-forwarded-for'];
        let ip;
        if (forwarded) {
            ip = (typeof forwarded === 'string' ? forwarded : forwarded[0]).split(',')[0].trim();
        }
        else {
            ip = request.ip || request.socket?.remoteAddress;
        }
        if (!ip)
            return undefined;
        if (ip === '::1')
            return '127.0.0.1';
        if (ip.startsWith('::ffff:'))
            return ip.slice(7);
        return ip;
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
        const sensitiveFields = ['password', 'password_hash', 'token', 'refresh_token', 'secret'];
        for (const field of sensitiveFields) {
            if (field in sanitized) {
                sanitized[field] = '***REDACTED***';
            }
        }
        return sanitized;
    }
    sanitizeResult(result) {
        if (!result || typeof result !== 'object')
            return result;
        if (Array.isArray(result) && result.length > 10) {
            return { count: result.length, truncated: true };
        }
        const sanitized = { ...result };
        const sensitiveFields = ['password', 'password_hash', 'token', 'refresh_token', 'secret'];
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
        activity_logs_service_1.ActivityLogsService])
], ActivityLogInterceptor);
//# sourceMappingURL=activity-log.interceptor.js.map