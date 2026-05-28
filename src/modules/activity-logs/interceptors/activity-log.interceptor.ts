import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { ActivityLogsService } from '../activity-logs.service';
import { LOG_ACTIVITY_KEY, LogActivityOptions, LogActivityContext } from '../decorators/log-activity.decorator';
import { Request } from 'express';

@Injectable()
export class ActivityLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ActivityLogInterceptor.name);

  constructor(
    private reflector: Reflector,
    private activityLogsService: ActivityLogsService,
  ) {
    console.log('>>> ActivityLogInterceptor CONSTRUCTOR CALLED - Interceptor registered!');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    console.log('[ActivityLogInterceptor] intercept() called - START');
    
    const request = context.switchToHttp().getRequest<Request>();
    
    // Log ALL requests for debugging
    console.log(`[INTERCEPTOR] ${request?.method} ${request?.path} - Checking for @LogActivity...`);
    
    const options = this.reflector.getAllAndOverride<LogActivityOptions>(LOG_ACTIVITY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no @LogActivity decorator, skip logging
    if (!options) {
      console.log(`[INTERCEPTOR] ${request.method} ${request.path} - No @LogActivity decorator found`);
      return next.handle();
    }

    const user = (request as any).user;
    
    // Debug logging - using console.log to guarantee visibility
    console.log(`[ActivityLogInterceptor] ${request.method} ${request.path} - @LogActivity found`);

    // Skip if no user (shouldn't happen with JwtAuthGuard, but just in case)
    if (!user) {
      this.logger.warn(`Activity logging SKIPPED for ${request.method} ${request.path}: No user in request`);
      return next.handle();
    }

    // JWT strategy returns { userId, email, role } — normalise to a consistent shape
    const userId = user.id ?? user.userId;

    // Extract request context
    const ipAddress = this.getClientIp(request);
    const userAgent = request.headers['user-agent'] as string | undefined;
    const deviceName = this.getDeviceName(userAgent);

    const startTime = Date.now();

    return next.handle().pipe(
      tap(async (result) => {
        try {
          // Don't log if result is null/undefined and ignoreNullEntity is true
          if (options.ignoreNullEntity && (result === null || result === undefined)) {
            return;
          }

          // Build context for description generation
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
            device_name: deviceName,
          };

          // Generate description
          let description: string;
          if (typeof options.description === 'function') {
            description = await options.description(logContext);
          } else {
            description = options.description;
          }

          // Extract entity ID from result or params
          let entityId: string | undefined;
          if (options.entityIdParam) {
            const paramValue = request.params[options.entityIdParam];
            if (paramValue) {
              entityId = Array.isArray(paramValue) ? paramValue[0] : paramValue;
            }
          } else if (result && typeof result === 'object' && 'id' in result) {
            entityId = result.id;
          }

          // Create the activity log
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
        } catch (error) {
          // Don't let logging errors break the main flow
          this.logger.error(`Failed to log activity: ${error.message}`, error.stack);
        }
      }),
    );
  }

  private getClientIp(request: Request): string | undefined {
    const forwarded = request.headers['x-forwarded-for'];
    let ip: string | undefined;
    if (forwarded) {
      ip = (typeof forwarded === 'string' ? forwarded : forwarded[0]).split(',')[0].trim();
    } else {
      ip = request.ip || request.socket?.remoteAddress;
    }
    if (!ip) return undefined;
    // Normalize IPv6 loopback to readable form
    if (ip === '::1') return '127.0.0.1';
    // Normalize IPv4-mapped IPv6 addresses e.g. ::ffff:192.168.1.1 → 192.168.1.1
    if (ip.startsWith('::ffff:')) return ip.slice(7);
    return ip;
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
    // Remove sensitive fields
    const sensitiveFields = ['password', 'password_hash', 'token', 'refresh_token', 'secret'];
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '***REDACTED***';
      }
    }
    return sanitized;
  }

  private sanitizeResult(result: any): any {
    if (!result || typeof result !== 'object') return result;

    // If it's a large result, only keep essential fields
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
}
