import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { ActivityLogsService } from '../activity-logs.service';
export declare class ActivityLogInterceptor implements NestInterceptor {
    private reflector;
    private activityLogsService;
    private readonly logger;
    constructor(reflector: Reflector, activityLogsService: ActivityLogsService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
    private logActivityAsync;
    private getClientIp;
    private getDeviceName;
    private sanitizeBody;
    private sanitizeResult;
}
