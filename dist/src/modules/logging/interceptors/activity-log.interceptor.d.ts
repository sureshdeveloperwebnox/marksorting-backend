import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { ActivityLogService } from '../services/activity-log.service';
export declare class ActivityLogInterceptor implements NestInterceptor {
    private reflector;
    private activityLogService;
    private readonly logger;
    constructor(reflector: Reflector, activityLogService: ActivityLogService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
    private getClientIp;
    private getDeviceName;
    private sanitizeBody;
}
