import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { ActivityLogsService } from '../activity-logs.service';
export declare class AutoActivityLogInterceptor implements NestInterceptor {
    private reflector;
    private activityLogsService;
    private readonly logger;
    private readonly EXCLUDED_PATHS;
    constructor(reflector: Reflector, activityLogsService: ActivityLogsService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
    private logActivityAsync;
    private isMutatingMethod;
    private detectActionAndEntity;
    private extractEntityName;
    private extractEntityContext;
    private extractEntityId;
    private buildDescription;
    private getClientIp;
    private getDeviceName;
    private sanitizeBody;
    private sanitizeResult;
}
