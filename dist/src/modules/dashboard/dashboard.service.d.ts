import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
export declare class DashboardService {
    private prisma;
    private redis;
    private readonly CACHE_KEY;
    constructor(prisma: PrismaService, redis: RedisService);
    getDashboardData(startDate?: string, endDate?: string): Promise<any>;
}
