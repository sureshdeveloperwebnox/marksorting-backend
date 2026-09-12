import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { Prisma } from '@prisma/client';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
export declare class MaterialsService {
    private prisma;
    private redis;
    private readonly CACHE_PREFIX;
    private readonly LIST_CACHE_KEY;
    constructor(prisma: PrismaService, redis: RedisService);
    findAll(params: {
        skip?: number;
        take?: number;
        where?: Prisma.MaterialWhereInput;
        orderBy?: Prisma.MaterialOrderByWithRelationInput;
    }): Promise<any>;
    findById(id: string): Promise<any>;
    create(dto: CreateMaterialDto): Promise<{
        id: string;
        description: string | null;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        name: string;
        status: string;
        uom: string | null;
    }>;
    update(id: string, dto: UpdateMaterialDto): Promise<{
        before: {
            id: string;
            description: string | null;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            name: string;
            status: string;
            uom: string | null;
        };
        after: {
            id: string;
            description: string | null;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            name: string;
            status: string;
            uom: string | null;
        };
    }>;
    remove(id: string): Promise<{
        id: string;
        description: string | null;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        name: string;
        status: string;
        uom: string | null;
    }>;
    private invalidateCache;
}
