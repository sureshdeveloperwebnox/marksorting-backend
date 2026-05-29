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
            material_id: string;
            store_id: string;
        })[];
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        customer_id: string;
        frame_number: string;
        barcode: string | null;
        warranty_status: string;
        return_status: string;
        inflow_status: string;
        service_engineer_id: string;
        quantity: number;
    }>;
    update(id: string, dto: UpdateStoreDto): Promise<{
        before: {
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            customer_id: string;
            frame_number: string;
            barcode: string | null;
            warranty_status: string;
            return_status: string;
            inflow_status: string;
            service_engineer_id: string;
            quantity: number;
        };
        after: {
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
                material_id: string;
                store_id: string;
            })[];
        } & {
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            customer_id: string;
            frame_number: string;
            barcode: string | null;
            warranty_status: string;
            return_status: string;
            inflow_status: string;
            service_engineer_id: string;
            quantity: number;
        };
    }>;
    remove(id: string): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        customer_id: string;
        frame_number: string;
        barcode: string | null;
        warranty_status: string;
        return_status: string;
        inflow_status: string;
        service_engineer_id: string;
        quantity: number;
    }>;
    private invalidateCache;
}
