import { PrismaService } from '../../prisma/prisma.service';
import { CreateActivityLogDto } from './dto/create-activity-log.dto';
import { QueryActivityLogsDto } from './dto/query-activity-logs.dto';
import { Prisma } from '@prisma/client';
export declare class ActivityLogsService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    create(dto: CreateActivityLogDto): Promise<({
        user: {
            id: string;
            full_name: string;
            email: string;
        };
    } & {
        id: string;
        description: string;
        created_at: Date;
        user_id: string;
        action: string;
        entity_type: string | null;
        entity_id: string | null;
        metadata: Prisma.JsonValue | null;
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
    }) | null>;
    findAll(dto: QueryActivityLogsDto): Promise<{
        data: ({
            user: {
                id: string;
                full_name: string;
                email: string;
            };
        } & {
            id: string;
            description: string;
            created_at: Date;
            user_id: string;
            action: string;
            entity_type: string | null;
            entity_id: string | null;
            metadata: Prisma.JsonValue | null;
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
        })[];
        meta: {
            total: number;
            skip: number;
            take: number;
            has_more: boolean;
        };
    }>;
    getUserActivity(userId: string, limit?: number): Promise<({
        user: {
            id: string;
            full_name: string;
            email: string;
        };
    } & {
        id: string;
        description: string;
        created_at: Date;
        user_id: string;
        action: string;
        entity_type: string | null;
        entity_id: string | null;
        metadata: Prisma.JsonValue | null;
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
        description: string;
        created_at: Date;
        user_id: string;
        action: string;
        entity_type: string | null;
        entity_id: string | null;
        metadata: Prisma.JsonValue | null;
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
    cleanup(olderThanDays?: number): Promise<{
        deleted_count: number;
    }>;
    exportToExcel(dto: QueryActivityLogsDto): Promise<Buffer>;
}
