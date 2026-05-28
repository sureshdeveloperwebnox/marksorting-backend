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
import { ActivityAction } from '../enums/activity-action.enum';

/**
 * Auto Activity Log Interceptor
 * 
 * This interceptor automatically logs ALL mutating HTTP requests (POST, PUT, DELETE, PATCH)
 * unless they have an explicit @LogActivity decorator (which takes precedence).
 * Auth endpoints are excluded since they handle their own logging manually.
 * 
 * This ensures comprehensive activity logging without needing to add decorators to every endpoint.
 */
@Injectable()
export class AutoActivityLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AutoActivityLogInterceptor.name);

  private readonly EXCLUDED_PATHS = [
    '/auth/login',
    '/auth/logout',
    '/auth/register',
    '/auth/refresh',
    '/auth/mobile/login',
  ];

  constructor(
    private reflector: Reflector,
    private activityLogsService: ActivityLogsService,
  ) {
    console.log('>>> AutoActivityLogInterceptor CONSTRUCTOR CALLED - Interceptor registered!');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    console.log('[AutoActivityLogInterceptor] intercept() called - START');
    
    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method;
    const path = request.path;
    
    // Only intercept mutating methods
    if (!this.isMutatingMethod(method)) {
      return next.handle();
    }

    // Skip auth endpoints — they manage their own activity logging
    if (this.EXCLUDED_PATHS.some((excluded) => path.endsWith(excluded))) {
      return next.handle();
    }

    // Check if there's an explicit @LogActivity decorator
    const explicitOptions = this.reflector.getAllAndOverride<LogActivityOptions>(LOG_ACTIVITY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If explicit decorator exists, let the other interceptor handle it
    if (explicitOptions) {
      return next.handle();
    }

    const user = (request as any).user;

    // Debug logging
    this.logger.log(`Auto-interceptor: ${method} ${path} - User: ${user?.email || 'none'}`);

    // Skip if no user
    if (!user) {
      this.logger.warn(`Auto-logging SKIPPED for ${method} ${path}: No user in request`);
      return next.handle();
    }

    // JWT strategy returns { userId, email, role } — normalise to a consistent shape
    const userId = user.id ?? user.userId;

    // Extract request context
    const ipAddress = this.getClientIp(request);
    const userAgent = request.headers['user-agent'] as string | undefined;
    const deviceName = this.getDeviceName(userAgent);
    const startTime = Date.now();

    // Auto-detect action and entity type from URL
    const { action, entityType } = this.detectActionAndEntity(method, path);

    return next.handle().pipe(
      tap(async (result) => {
        try {
          // Skip if result is null/undefined
          if (result === null || result === undefined) {
            return;
          }

          // Extract entity name from body or result
          const entityName = this.extractEntityName(request.body, result);
          const entityId = this.extractEntityId(request.params, result);

          // Build description
          const description = this.buildDescription(action, entityType, entityName, entityId, path, result);

          // Create the activity log
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
        } catch (error) {
          // Don't let logging errors break the main flow
          this.logger.error(`Failed to auto-log activity: ${error.message}`, error.stack);
        }
      }),
    );
  }

  private isMutatingMethod(method: string): boolean {
    return ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);
  }

  private detectActionAndEntity(method: string, path: string): { action: ActivityAction; entityType: string } {
    // Extract entity from path (e.g., /api/v1/customers/123 -> customers)
    // Remove query strings and split
    const cleanPath = path.split('?')[0];
    const pathParts = cleanPath.split('/').filter(p => p && p !== 'api');
    
    // Find the entity part (skip version numbers like v1, v2)
    let entityType = 'unknown';
    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      // Skip if it's a version (v1, v2) or numeric ID
      if (part.match(/^v\d+$/)) continue;
      if (part.match(/^\d+$/) || part.match(/^[0-9a-f-]{36}$/)) continue; // Skip IDs
      
      // This is likely the entity
      entityType = part;
      break;
    }

    let action: ActivityAction;
    switch (method) {
      case 'POST':
        action = ActivityAction.CREATE;
        break;
      case 'PUT':
      case 'PATCH':
        action = ActivityAction.UPDATE;
        break;
      case 'DELETE':
        action = ActivityAction.DELETE;
        break;
      default:
        action = ActivityAction.VIEW;
    }

    return { action, entityType };
  }

  private extractEntityName(body: any, result: any): string | undefined {
    // Prefer result (DB return) over request body for accuracy
    const sources = [result, body].filter(Boolean);

    for (const data of sources) {
      if (!data || typeof data !== 'object') continue;

      // Structured report/expense numbers take highest priority
      if (data.report_number) return data.report_number;
      if (data.expense_number) return data.expense_number;
      if (data.frame_number) return `Frame: ${data.frame_number}`;

      // Named entity identifiers
      const nameFields = ['name', 'full_name', 'title', 'subject', 'key'];
      for (const field of nameFields) {
        if (data[field] && typeof data[field] === 'string') {
          return data[field].substring(0, 100);
        }
      }

      // Email as fallback identifier
      if (data.email && typeof data.email === 'string') {
        return data.email;
      }
    }

    return undefined;
  }

  private extractEntityContext(result: any): string {
    if (!result || typeof result !== 'object') return '';
    const parts: string[] = [];
    if (result.machine_model) parts.push(`Machine: ${result.machine_model}`);
    if (result.place) parts.push(`Place: ${result.place}`);
    if (result.mill?.name) parts.push(`Mill: ${result.mill.name}`);
    if (result.expenseCategory?.name) parts.push(`Category: ${result.expenseCategory.name}`);
    if (result.amount) parts.push(`Amount: ₹${result.amount}`);
    if (result.status) parts.push(`Status: ${result.status}`);
    if (result.priority) parts.push(`Priority: ${result.priority}`);
    return parts.length > 0 ? ` | ${parts.join(' | ')}` : '';
  }

  private extractEntityId(params: any, result: any): string | undefined {
    if (params?.id) return params.id;
    if (result && typeof result === 'object' && 'id' in result) {
      return result.id;
    }
    return undefined;
  }

  private buildDescription(
    action: ActivityAction, 
    entityType: string, 
    entityName: string | undefined,
    entityId: string | undefined,
    path: string,
    result?: any,
  ): string {
    const actionVerb: Record<string, string> = {
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

  private getClientIp(request: Request): string | undefined {
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      return (typeof forwarded === 'string' ? forwarded : forwarded[0]).split(',')[0].trim();
    }
    return request.ip || request.socket.remoteAddress;
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
    const sensitiveFields = ['password', 'password_hash', 'token', 'refresh_token', 'secret', 'api_key'];
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '***REDACTED***';
      }
    }
    return sanitized;
  }

  private sanitizeResult(result: any): any {
    if (!result || typeof result !== 'object') return result;

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
