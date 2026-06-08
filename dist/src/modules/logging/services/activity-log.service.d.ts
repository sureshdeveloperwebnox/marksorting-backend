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
        total_activities: number;
        most_active_user: {
            activity_count: number;
            id: string;
            full_name: string;
            email: string;
        } | null;
        most_common_action: {
            action: string;
            count: number;
        } | null;
        login_count: number;
        logout_count: number;
    }>;
    getUserActivity(userId: string, limit?: number): Promise<({
        user: {
            id: string;
            full_name: string;
            email: string;
        };
    } & {
        id: string;
        created_at: Date;
        description: string;
        user_id: string;
        action: string;
        entity_type: string | null;
        entity_id: string | null;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
        ip_address: string | null;
        user_agent: string | null;
        device_name: string | null;
        browser: string | null;
        os: string | null;
        correlation_id: string | null;
        request_id: string | null;
        session_id: string | null;
        execution_time_ms: number | null;
        archived: boolean;
    })[]>;
    getEntityActivity(entityType: string, entityId: string, limit?: number): Promise<({
        user: {
            id: string;
            full_name: string;
            email: string;
        };
    } & {
        id: string;
        created_at: Date;
        description: string;
        user_id: string;
        action: string;
        entity_type: string | null;
        entity_id: string | null;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
        ip_address: string | null;
        user_agent: string | null;
        device_name: string | null;
        browser: string | null;
        os: string | null;
        correlation_id: string | null;
        request_id: string | null;
        session_id: string | null;
        execution_time_ms: number | null;
        archived: boolean;
    })[]>;
    cleanup(olderThanDays?: number): Promise<{
        deleted: number;
    }>;
    private parseUserAgent;
}
