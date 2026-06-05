import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { Prisma } from '@prisma/client';
import { CreateMillDto } from './dto/create-mill.dto';
import { UpdateMillDto } from './dto/update-mill.dto';
export declare class MillsService {
    private prisma;
    private redis;
    private readonly CACHE_PREFIX;
    private readonly LIST_CACHE_KEY;
    constructor(prisma: PrismaService, redis: RedisService);
    findAll(params: {
        skip?: number;
        take?: number;
        where?: Prisma.MillWhereInput;
        orderBy?: Prisma.MillOrderByWithRelationInput;
    }): Promise<any>;
    findById(id: string): Promise<any>;
    create(dto: CreateMillDto): Promise<{
        id: string;
        created_at: Date;
        email: string | null;
        updated_at: Date;
        deleted_at: Date | null;
        name: string;
        phone: string | null;
        status: string;
        address: string | null;
        customer_id: string | null;
    }>;
    update(id: string, dto: UpdateMillDto): Promise<{
        before: {
            id: string;
            created_at: Date;
            email: string | null;
            updated_at: Date;
            deleted_at: Date | null;
            name: string;
            phone: string | null;
            status: string;
            address: string | null;
            customer_id: string | null;
        };
        after: {
            id: string;
            created_at: Date;
            email: string | null;
            updated_at: Date;
            deleted_at: Date | null;
            name: string;
            phone: string | null;
            status: string;
            address: string | null;
            customer_id: string | null;
        };
    }>;
    remove(id: string): Promise<{
        id: string;
        created_at: Date;
        email: string | null;
        updated_at: Date;
        deleted_at: Date | null;
        name: string;
        phone: string | null;
        status: string;
        address: string | null;
        customer_id: string | null;
    }>;
    private invalidateCache;
}
