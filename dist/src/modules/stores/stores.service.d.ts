import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { Prisma } from '@prisma/client';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { UpdateStoreReturnDto } from './dto/update-store-return.dto';
export declare class StoresService {
    private prisma;
    private redis;
    private readonly CACHE_PREFIX;
    private readonly LIST_CACHE_KEY;
    constructor(prisma: PrismaService, redis: RedisService);
    findAll(params: {
        skip?: number;
        take?: number;
        where?: Prisma.StoreWhereInput;
        orderBy?: Prisma.StoreOrderByWithRelationInput;
    }): Promise<any>;
    findById(id: string): Promise<any>;
    create(dto: CreateStoreDto): Promise<any>;
    update(id: string, dto: UpdateStoreDto): Promise<{
        before: any;
        after: any;
    }>;
    remove(id: string): Promise<any>;
    findByTechnician(technicianId: string, params: {
        skip?: number;
        take?: number;
        search?: string;
        return_status?: string;
        inflow_status?: string;
        warranty_status?: string;
    }): Promise<{
        stores: any;
        total: any;
    }>;
    findPendingByTechnician(technicianId: string, params: {
        skip?: number;
        take?: number;
        search?: string;
    }): Promise<{
        stores: any;
        total: any;
    }>;
    submitReturnDetails(storeId: string, technicianId: string, dto: UpdateStoreReturnDto): Promise<{
        before: any;
        after: any;
    }>;
    findByIdAndTechnician(id: string, technicianId: string): Promise<any>;
    updateByTechnician(id: string, technicianId: string, dto: UpdateStoreDto): Promise<{
        before: any;
        after: any;
    }>;
    removeByTechnician(id: string, technicianId: string): Promise<any>;
    private invalidateCache;
}
