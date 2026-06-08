import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { ActivityLogService } from '../services/activity-log.service';
import {
  LOG_ACTIVITY_KEY,
  LogActivityOptions,
  LogActivityContext,
} from '../../activity-logs/decorators/log-activity.decorator';
import { Request } from 'express';

@Injectable()
export class ActivityLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ActivityLogInterceptor.name);

  constructor(
    private reflector: Reflector,
    private activityLogService: ActivityLogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const options = this.reflector.getAllAndOverride<LogActivityOptions>(
      LOG_ACTIVITY_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!options) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as any).user;

    if (!user) {
      this.logger.warn(`Activity logging skipped: No user in request`);
      return next.handle();
    }

    // JWT strategy returns { userId, email, role } — normalise to a consistent shape
    const userId = user.id ?? user.userId;

    const ipAddress = this.getClientIp(request);
    const userAgent = request.headers['user-agent'];
    const correlationId = request['correlationId'];
    const requestId = request['requestId'];
    const sessionId = request.cookies?.['session_id'];

    const startTime = Date.now();

    return next.handle().pipe(
      tap(async (result) => {
        try {
          if (
            options.ignoreNullEntity &&
            (result === null || result === undefined)
          ) {
            return;
          }

          const logContext: LogActivityContext = {
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

          let description: string;
          if (typeof options.description === 'function') {
            description = await options.description(logContext);
          } else {
            description = options.description;
          }

          let entityId: string | undefined;
          if (options.entityIdParam) {
            const paramKey = Array.isArray(options.entityIdParam)
              ? options.entityIdParam[0]
              : options.entityIdParam;
            entityId = request.params[paramKey];
          } else if (result && typeof result === 'object' && 'id' in result) {
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
        } catch (error) {
          this.logger.error(
            `Failed to log activity: ${(error as Error).message}`,
            (error as Error).stack,
          );
        }
      }),
    );
  }

  private getClientIp(request: Request): string | undefined {
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      return (typeof forwarded === 'string' ? forwarded : forwarded[0])
        .split(',')[0]
        .trim();
    }
    return request.ip || request.socket?.remoteAddress;
  }

  private getDeviceName(userAgent?: string): string | undefined {
    if (!userAgent) return undefined;
    if (userAgent.includes('Mobile')) return 'Mobile';
    if (userAgent.includes('Tablet')) return 'Tablet';
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'Mac';
    if (userAgent.includes('Linux')) return 'Linux';
    return 'Unknown';
  }

  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') return body;
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
}
