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
var AutoActivityLogInterceptor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoActivityLogInterceptor = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const rxjs_1 = require("rxjs");
const activity_logs_service_1 = require("../activity-logs.service");
const log_activity_decorator_1 = require("../decorators/log-activity.decorator");
const activity_action_enum_1 = require("../enums/activity-action.enum");
let AutoActivityLogInterceptor = AutoActivityLogInterceptor_1 = class AutoActivityLogInterceptor {
    reflector;
    activityLogsService;
    logger = new common_1.Logger(AutoActivityLogInterceptor_1.name);
    EXCLUDED_PATHS = [
        '/auth/login',
        '/auth/logout',
        '/auth/register',
        '/auth/refresh',
        '/auth/mobile/login',
    ];
    constructor(reflector, activityLogsService) {
        this.reflector = reflector;
        this.activityLogsService = activityLogsService;
        console.log('>>> AutoActivityLogInterceptor CONSTRUCTOR CALLED - Interceptor registered!');
    }
    intercept(context, next) {
        console.log('[AutoActivityLogInterceptor] intercept() called - START');
        const request = context.switchToHttp().getRequest();
        const method = request.method;
        const path = request.path;
        if (!this.isMutatingMethod(method)) {
            return next.handle();
        }
        if (this.EXCLUDED_PATHS.some((excluded) => path.endsWith(excluded))) {
            return next.handle();
        }
        const explicitOptions = this.reflector.getAllAndOverride(log_activity_decorator_1.LOG_ACTIVITY_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (explicitOptions) {
            return next.handle();
        }
        const user = request.user;
        this.logger.log(`Auto-interceptor: ${method} ${path} - User: ${user?.email || 'none'}`);
        if (!user) {
            this.logger.warn(`Auto-logging SKIPPED for ${method} ${path}: No user in request`);
            return next.handle();
        }
        const userId = user.id ?? user.userId;
        const ipAddress = this.getClientIp(request);
        const userAgent = request.headers['user-agent'];
        const deviceName = this.getDeviceName(userAgent);
        const startTime = Date.now();
        const { action, entityType } = this.detectActionAndEntity(method, path);
        return next.handle().pipe((0, rxjs_1.tap)(async (result) => {
            try {
                if (result === null || result === undefined) {
                    return;
                }
                const entityName = this.extractEntityName(request.body, result);
                const entityId = this.extractEntityId(request.params, result);
                const description = this.buildDescription(action, entityType, entityName, entityId, path, result);
                await this.activityLogsService.create({
                    user_id: userId,
                    action,
                    entity_type: entityType,
                    entity_id: entityId,
                    description,
                    metadata: {
                        execution_time_ms: Date.now() - startTime,
                        method: request.method,
                        path: request.path,
                        body: this.sanitizeBody(request.body),
                        result: this.sanitizeResult(result),
                        auto_logged: true,
                    },
                    ip_address: ipAddress,
                    user_agent: userAgent,
                    device_name: deviceName,
                });
                this.logger.log(`AUTO-LOGGED: ${action} ${entityType} - ${description}`);
            }
            catch (error) {
                this.logger.error(`Failed to auto-log activity: ${error.message}`, error.stack);
            }
        }));
    }
    isMutatingMethod(method) {
        return ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);
    }
    detectActionAndEntity(method, path) {
        const cleanPath = path.split('?')[0];
        const pathParts = cleanPath.split('/').filter(p => p && p !== 'api');
        let entityType = 'unknown';
        for (let i = 0; i < pathParts.length; i++) {
            const part = pathParts[i];
            if (part.match(/^v\d+$/))
                continue;
            if (part.match(/^\d+$/) || part.match(/^[0-9a-f-]{36}$/))
                continue;
            entityType = part;
            break;
        }
        let action;
        switch (method) {
            case 'POST':
                action = activity_action_enum_1.ActivityAction.CREATE;
                break;
            case 'PUT':
            case 'PATCH':
                action = activity_action_enum_1.ActivityAction.UPDATE;
                break;
            case 'DELETE':
                action = activity_action_enum_1.ActivityAction.DELETE;
                break;
            default:
                action = activity_action_enum_1.ActivityAction.VIEW;
        }
        return { action, entityType };
    }
    extractEntityName(body, result) {
        const sources = [result, body].filter(Boolean);
        for (const data of sources) {
            if (!data || typeof data !== 'object')
                continue;
            if (data.report_number)
                return data.report_number;
            if (data.expense_number)
                return data.expense_number;
            if (data.frame_number)
                return `Frame: ${data.frame_number}`;
            const nameFields = ['name', 'full_name', 'title', 'subject', 'key'];
            for (const field of nameFields) {
                if (data[field] && typeof data[field] === 'string') {
                    return data[field].substring(0, 100);
                }
            }
            if (data.email && typeof data.email === 'string') {
                return data.email;
            }
        }
        return undefined;
    }
    extractEntityContext(result) {
        if (!result || typeof result !== 'object')
            return '';
        const parts = [];
        if (result.machine_model)
            parts.push(`Machine: ${result.machine_model}`);
        if (result.place)
            parts.push(`Place: ${result.place}`);
        if (result.mill?.name)
            parts.push(`Mill: ${result.mill.name}`);
        if (result.expenseCategory?.name)
            parts.push(`Category: ${result.expenseCategory.name}`);
        if (result.amount)
            parts.push(`Amount: ₹${result.amount}`);
        if (result.status)
            parts.push(`Status: ${result.status}`);
        if (result.priority)
            parts.push(`Priority: ${result.priority}`);
        return parts.length > 0 ? ` | ${parts.join(' | ')}` : '';
    }
    extractEntityId(params, result) {
        if (params?.id)
            return params.id;
        if (result && typeof result === 'object' && 'id' in result) {
            return result.id;
        }
        return undefined;
    }
    buildDescription(action, entityType, entityName, entityId, path, result) {
        const actionVerb = {
            CREATE: 'Created',
            UPDATE: 'Updated',
            DELETE: 'Deleted',
            VIEW: 'Viewed',
            EXPORT: 'Exported',
            UPLOAD: 'Uploaded',
            ASSIGN: 'Assigned',
            APPROVE: 'Approved',
            REJECT: 'Rejected',
            COMPLETE: 'Completed',
            CANCEL: 'Cancelled',
            RESTORE: 'Restored',
            CHANGE_STATUS: 'Changed status of',
        };
        const verb = actionVerb[action] || action.toLowerCase();
        const entityLabel = entityType.replace(/_/g, ' ');
        const context = this.extractEntityContext(result);
        if (entityName) {
            return `${verb} ${entityLabel} "${entityName}"${context}`;
        }
        if (entityId) {
            return `${verb} ${entityLabel} (ID: ${entityId.substring(0, 8)}...)${context}`;
        }
        return `${verb} ${entityLabel}${context || ` via ${path}`}`;
    }
    getClientIp(request) {
        const forwarded = request.headers['x-forwarded-for'];
        if (forwarded) {
            return (typeof forwarded === 'string' ? forwarded : forwarded[0]).split(',')[0].trim();
        }
        return request.ip || request.socket.remoteAddress;
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
        const sensitiveFields = ['password', 'password_hash', 'token', 'refresh_token', 'secret', 'api_key'];
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
exports.AutoActivityLogInterceptor = AutoActivityLogInterceptor;
exports.AutoActivityLogInterceptor = AutoActivityLogInterceptor = AutoActivityLogInterceptor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        activity_logs_service_1.ActivityLogsService])
], AutoActivityLogInterceptor);
//# sourceMappingURL=auto-activity-log.interceptor.js.map