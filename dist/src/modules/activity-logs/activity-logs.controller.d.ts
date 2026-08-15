import type { Response } from 'express';
import { ActivityLogsService } from './activity-logs.service';
import { QueryActivityLogsDto } from './dto/query-activity-logs.dto';
export declare class ActivityLogsController {
    private readonly activityLogsService;
    constructor(activityLogsService: ActivityLogsService);
    findAll(dto: QueryActivityLogsDto): Promise<{
        data: any;
        meta: {
            total: any;
            skip: number;
            take: number;
            has_more: boolean;
        };
    }>;
    getStats(startDate?: string, endDate?: string): Promise<{
        total_activities: any;
        most_active_user: any;
        most_common_action: {
            action: any;
            count: any;
        } | null;
        login_count: any;
        logout_count: any;
    }>;
    getUserActivity(userId: string, limit?: string): Promise<any>;
    getEntityActivity(entityType: string, entityId: string, limit?: string): Promise<any>;
    exportToExcel(dto: QueryActivityLogsDto, res: Response): Promise<void>;
}
