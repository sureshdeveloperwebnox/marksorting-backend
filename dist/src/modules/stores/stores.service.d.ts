import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { Prisma } from '@prisma/client';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
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
    create(dto: CreateStoreDto): Promise<{
        customer: {
            id: string;
            name: string;
        };
        service_engineer: {
            id: string;
            full_name: string;
        };
        materials: ({
            material: {
                id: string;
                name: string;
            };
        } & {
            store_id: string;
            material_id: string;
        })[];
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        customer_id: string;
        service_engineer_id: string;
        quantity: number;
        warranty_status: string;
        frame_number: string;
        return_status: string;
        inflow_status: string;
        barcode: string | null;
    }>;
    update(id: string, dto: UpdateStoreDto): Promise<{
        customer: {
            id: string;
            name: string;
        };
        service_engineer: {
            id: string;
            full_name: string;
        };
        materials: ({
            material: {
                id: string;
                name: string;
            };
        } & {
            store_id: string;
            material_id: string;
        })[];
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        customer_id: string;
        service_engineer_id: string;
        quantity: number;
        warranty_status: string;
        frame_number: string;
        return_status: string;
        inflow_status: string;
        barcode: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        customer_id: string;
        service_engineer_id: string;
        quantity: number;
        warranty_status: string;
        frame_number: string;
        return_status: string;
        inflow_status: string;
        barcode: string | null;
    }>;
    private invalidateCache;
}
