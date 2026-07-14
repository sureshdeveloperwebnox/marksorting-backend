import { OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { Prisma } from '@prisma/client';
export declare class TechniciansService implements OnApplicationBootstrap {
    private prisma;
    private redis;
    private readonly CACHE_PREFIX;
    private readonly LIST_CACHE_KEY;
    constructor(prisma: PrismaService, redis: RedisService);
    onApplicationBootstrap(): Promise<void>;
    syncTechnicians(): Promise<void>;
    findAll(params: {
        skip?: number;
        take?: number;
        where?: Prisma.TechnicianWhereInput;
        orderBy?: Prisma.TechnicianOrderByWithRelationInput;
    }): Promise<any>;
    findById(id: string): Promise<any>;
    updateStatus(id: string, status: string): Promise<{
        id: string;
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        full_name: string;
        email: string | null;
        phone: string | null;
    }>;
    private invalidateCache;
}
