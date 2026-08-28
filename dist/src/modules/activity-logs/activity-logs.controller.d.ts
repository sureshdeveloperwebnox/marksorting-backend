import type { Response } from 'express';
import { ActivityLogsService } from './activity-logs.service';
import { QueryActivityLogsDto } from './dto/query-activity-logs.dto';
export declare class ActivityLogsController {
    private readonly activityLogsService;
    constructor(activityLogsService: ActivityLogsService);
    findAll(dto: QueryActivityLogsDto): Promise<{
        data: ({
            user: {
                id: string;
                full_name: string;
                email: string;
            };
        } & {
            id: string;
            user_id: string;
            action: string;
            entity_type: string | null;
            entity_id: string | null;
            description: string;
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
            created_at: Date;
        })[];
        meta: {
            total: number;
            skip: number;
            take: number;
            has_more: boolean;
        };
    }>;
    getStats(startDate?: string, endDate?: string): Promise<{
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
    getUserActivity(userId: string, limit?: string): Promise<({
        user: {
            id: string;
            full_name: string;
            email: string;
        };
    } & {
        id: string;
        user_id: string;
        action: string;
        entity_type: string | null;
        entity_id: string | null;
        description: string;
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
        created_at: Date;
    })[]>;
    getEntityActivity(entityType: string, entityId: string, limit?: string): Promise<({
        user: {
            id: string;
            full_name: string;
            email: string;
        };
    } & {
        id: string;
        user_id: string;
        action: string;
        entity_type: string | null;
        entity_id: string | null;
        description: string;
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
        created_at: Date;
    })[]>;
    exportToExcel(dto: QueryActivityLogsDto, res: Response): Promise<void>;
}
