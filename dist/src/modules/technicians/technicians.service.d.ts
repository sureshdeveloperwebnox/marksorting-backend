import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { Prisma } from '@prisma/client';
export declare class TechniciansService {
    private prisma;
    private redis;
    private readonly CACHE_PREFIX;
    private readonly LIST_CACHE_KEY;
    constructor(prisma: PrismaService, redis: RedisService);
    syncTechnicians(): Promise<void>;
    findAll(params: {
        skip?: number;
        take?: number;
        where?: Prisma.TechnicianWhereInput;
        orderBy?: Prisma.TechnicianOrderByWithRelationInput;
    }): Promise<any>;
    findById(id: string): Promise<any>;
    updateStatus(id: string, status: string): Promise<{
        full_name: string;
        email: string | null;
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        status: string;
        phone: string | null;
    }>;
    private invalidateCache;
}
