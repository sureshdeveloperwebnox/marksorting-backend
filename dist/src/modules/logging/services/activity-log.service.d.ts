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
export declare class ActivityLogService {
    private prisma;
    private logQueue;
    private redis;
    private eventEmitter;
    private readonly logger;
    constructor(prisma: PrismaService, logQueue: LogQueueService, redis: RedisService, eventEmitter: EventEmitter2);
    create(options: CreateActivityLogOptions): Promise<void>;
    findAll(query: any): Promise<any>;
    getStats(startDate?: Date, endDate?: Date): Promise<{
        total_activities: any;
        most_active_user: any;
        most_common_action: {
            action: any;
            count: any;
        } | null;
        login_count: any;
        logout_count: any;
    }>;
    getUserActivity(userId: string, limit?: number): Promise<any>;
    getEntityActivity(entityType: string, entityId: string, limit?: number): Promise<any>;
    cleanup(olderThanDays?: number): Promise<{
        deleted: number;
    }>;
    private parseUserAgent;
}
