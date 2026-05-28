import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { LogQueueService } from './log-queue.service';
import { RedisService } from '../../../redis/redis.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface CreateActivityLogOptions {
  userId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
  requestId?: string;
  sessionId?: string;
  executionTimeMs?: number;
  priority?: number;
  sync?: boolean;
}

@Injectable()
export class ActivityLogService {
  private readonly logger = new Logger(ActivityLogService.name);

  constructor(
    private prisma: PrismaService,
    private logQueue: LogQueueService,
    private redis: RedisService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(options: CreateActivityLogOptions): Promise<void> {
    try {
      const deviceInfo = this.parseUserAgent(options.userAgent);
      
      const logData = {
        userId: options.userId,
        action: options.action,
        entityType: options.entityType,
        entityId: options.entityId,
        description: options.description,
        metadata: options.metadata,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        deviceName: deviceInfo.deviceName,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        correlationId: options.correlationId,
        requestId: options.requestId,
        sessionId: options.sessionId,
        executionTimeMs: options.executionTimeMs,
      };

      if (options.sync) {
        await this.prisma.activityLog.create({
          data: {
            user_id: logData.userId,
            action: logData.action,
            entity_type: logData.entityType,
            entity_id: logData.entityId,
            description: logData.description,
            metadata: logData.metadata,
            ip_address: logData.ipAddress,
            user_agent: logData.userAgent,
            device_name: logData.deviceName,
            browser: logData.browser,
            os: logData.os,
            correlation_id: logData.correlationId,
            request_id: logData.requestId,
            session_id: logData.sessionId,
            execution_time_ms: logData.executionTimeMs,
          },
        });
      } else {
        await this.logQueue.addActivityLog(logData, { priority: options.priority });
      }

      this.eventEmitter.emit('activity-log.created', logData);

    } catch (error) {
      this.logger.error(`Failed to create activity log: ${(error as Error).message}`, (error as Error).stack);
    }
  }

  async findAll(query: any) {
    const { 
      skip = 0, 
      take = 25, 
      userId, 
      action, 
      entityType, 
      entityId,
      startDate,
      endDate,
      search,
    } = query;

    const cacheKey = `activity-logs:${JSON.stringify(query)}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const where: any = {};
    if (userId) where.user_id = userId;
    if (action) where.action = action;
    if (entityType) where.entity_type = entityType;
    if (entityId) where.entity_id = entityId;
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at.gte = new Date(startDate);
      if (endDate) where.created_at.lte = new Date(endDate);
    }
    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { action: { contains: search, mode: 'insensitive' } },
        { entity_type: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [logs, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        skip,
        take,
        orderBy: { created_at: 'desc' },
        include: {
          user: {
            select: { id: true, full_name: true, email: true },
          },
        },
      }),
      this.prisma.activityLog.count({ where }),
    ]);

    const result = {
      data: logs,
      meta: {
        total,
        skip,
        take,
        has_more: skip + take < total,
      },
    };

    await this.redis.setex(cacheKey, 30, JSON.stringify(result));

    return result;
  }

  async getStats(startDate?: Date, endDate?: Date) {
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.created_at = {};
      if (startDate) dateFilter.created_at.gte = startDate;
      if (endDate) dateFilter.created_at.lte = endDate;
    }

    const [
      totalActivities,
      mostActiveUser,
      mostCommonAction,
      loginLogoutStats,
    ] = await Promise.all([
      this.prisma.activityLog.count({ where: dateFilter }),
      this.prisma.activityLog.groupBy({
        by: ['user_id'],
        where: dateFilter,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 1,
      }),
      this.prisma.activityLog.groupBy({
        by: ['action'],
        where: dateFilter,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 1,
      }),
      this.prisma.activityLog.groupBy({
        by: ['action'],
        where: { ...dateFilter, action: { in: ['LOGIN', 'LOGOUT'] } },
        _count: { id: true },
      }),
    ]);

    let mostActiveUserDetails = null;
    if (mostActiveUser.length > 0) {
      const user = await this.prisma.user.findUnique({
        where: { id: mostActiveUser[0].user_id },
        select: { id: true, full_name: true, email: true },
      });
      if (user) {
        mostActiveUserDetails = {
          ...user,
          activity_count: mostActiveUser[0]._count.id,
        };
      }
    }

    const loginCount = loginLogoutStats.find(s => s.action === 'LOGIN')?._count.id || 0;
    const logoutCount = loginLogoutStats.find(s => s.action === 'LOGOUT')?._count.id || 0;

    return {
      total_activities: totalActivities,
      most_active_user: mostActiveUserDetails,
      most_common_action: mostCommonAction.length > 0
        ? { action: mostCommonAction[0].action, count: mostCommonAction[0]._count.id }
        : null,
      login_count: loginCount,
      logout_count: logoutCount,
    };
  }

  async getUserActivity(userId: string, limit: number = 100) {
    return this.prisma.activityLog.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: limit,
      include: {
        user: {
          select: { id: true, full_name: true, email: true },
        },
      },
    });
  }

  async getEntityActivity(entityType: string, entityId: string, limit: number = 100) {
    return this.prisma.activityLog.findMany({
      where: { entity_type: entityType, entity_id: entityId },
      orderBy: { created_at: 'desc' },
      take: limit,
      include: {
        user: {
          select: { id: true, full_name: true, email: true },
        },
      },
    });
  }

  async cleanup(olderThanDays: number = 90): Promise<{ deleted: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.prisma.activityLog.deleteMany({
      where: {
        created_at: { lt: cutoffDate },
        archived: true,
      },
    });

    this.logger.log(`Cleaned up ${result.count} activity logs older than ${olderThanDays} days`);
    return { deleted: result.count };
  }

  private parseUserAgent(userAgent?: string): { deviceName: string; browser: string; os: string } {
    if (!userAgent) {
      return { deviceName: 'Unknown', browser: 'Unknown', os: 'Unknown' };
    }

    let deviceName = 'Desktop';
    let browser = 'Unknown';
    let os = 'Unknown';

    if (userAgent.includes('Mobile')) deviceName = 'Mobile';
    else if (userAgent.includes('Tablet')) deviceName = 'Tablet';

    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'MacOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS')) os = 'iOS';

    return { deviceName, browser, os };
  }
}
