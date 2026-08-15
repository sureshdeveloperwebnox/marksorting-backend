import { PrismaService } from '../../prisma/prisma.service';
import { CreateActivityLogDto } from './dto/create-activity-log.dto';
import { QueryActivityLogsDto } from './dto/query-activity-logs.dto';
export declare class ActivityLogsService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    create(dto: CreateActivityLogDto): Promise<any>;
    findAll(dto: QueryActivityLogsDto): Promise<{
        data: any;
        meta: {
            total: any;
            skip: number;
            take: number;
            has_more: boolean;
        };
    }>;
    getUserActivity(userId: string, limit?: number): Promise<any>;
    getEntityActivity(entityType: string, entityId: string, limit?: number): Promise<any>;
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
    cleanup(olderThanDays?: number): Promise<{
        deleted_count: any;
    }>;
    exportToExcel(dto: QueryActivityLogsDto): Promise<Buffer>;
}
