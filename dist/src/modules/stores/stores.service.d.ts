import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { UpdateStoreReturnDto } from './dto/update-store-return.dto';
export declare class StoresService implements OnModuleInit {
    private prisma;
    private redis;
    private eventEmitter;
    private readonly CACHE_PREFIX;
    private readonly LIST_CACHE_KEY;
    constructor(prisma: PrismaService, redis: RedisService, eventEmitter: EventEmitter2);
    onModuleInit(): Promise<void>;
    findAll(params: {
        skip?: number;
        take?: number;
        where?: Prisma.StoreWhereInput;
        orderBy?: Prisma.StoreOrderByWithRelationInput;
    }): Promise<any>;
    private enrichStoresWithCustomer;
    findById(id: string): Promise<any>;
    create(dto: CreateStoreDto): Promise<{
        materials: ({
            material: {
                id: string;
                name: string;
            };
        } & {
            quantity: number;
            stock_type: string | null;
            store_id: string;
            material_id: string;
        })[];
        customer: {
            id: string;
            name: string;
        } | null;
        service_engineer: {
            id: string;
            full_name: string;
        };
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        invoice_number: string | null;
        store_number: string | null;
        service_engineer_id: string;
        customer_id: string | null;
        quantity: number;
        warranty_status: string;
        frame_number: string;
        return_status: string;
        inflow_status: string;
        stock_type: string | null;
        barcode: string | null;
        provider_name: string | null;
        remarks: string | null;
    }>;
    update(id: string, dto: UpdateStoreDto): Promise<{
        before: {
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            invoice_number: string | null;
            store_number: string | null;
            service_engineer_id: string;
            customer_id: string | null;
            quantity: number;
            warranty_status: string;
            frame_number: string;
            return_status: string;
            inflow_status: string;
            stock_type: string | null;
            barcode: string | null;
            provider_name: string | null;
            remarks: string | null;
        };
        after: {
            materials: ({
                material: {
                    id: string;
                    name: string;
                };
            } & {
                quantity: number;
                stock_type: string | null;
                store_id: string;
                material_id: string;
            })[];
            customer: {
                id: string;
                name: string;
            } | null;
            service_engineer: {
                id: string;
                full_name: string;
            };
        } & {
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            invoice_number: string | null;
            store_number: string | null;
            service_engineer_id: string;
            customer_id: string | null;
            quantity: number;
            warranty_status: string;
            frame_number: string;
            return_status: string;
            inflow_status: string;
            stock_type: string | null;
            barcode: string | null;
            provider_name: string | null;
            remarks: string | null;
        };
    }>;
    remove(id: string): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        invoice_number: string | null;
        store_number: string | null;
        service_engineer_id: string;
        customer_id: string | null;
        quantity: number;
        warranty_status: string;
        frame_number: string;
        return_status: string;
        inflow_status: string;
        stock_type: string | null;
        barcode: string | null;
        provider_name: string | null;
        remarks: string | null;
    }>;
    findByTechnician(technicianId: string, params: {
        skip?: number;
        take?: number;
        search?: string;
        return_status?: string;
        inflow_status?: string;
        warranty_status?: string;
    }): Promise<{
        stores: any[];
        total: number;
    }>;
    findPendingByTechnician(technicianId?: string, params?: {
        skip?: number;
        take?: number;
        search?: string;
        status?: string;
    }): Promise<{
        stores: any[];
        total: number;
    }>;
    submitReturnDetails(storeId: string, technicianId?: string, dto?: UpdateStoreReturnDto, isUserAdmin?: boolean): Promise<{
        before: {
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            invoice_number: string | null;
            store_number: string | null;
            service_engineer_id: string;
            customer_id: string | null;
            quantity: number;
            warranty_status: string;
            frame_number: string;
            return_status: string;
            inflow_status: string;
            stock_type: string | null;
            barcode: string | null;
            provider_name: string | null;
            remarks: string | null;
        };
        after: {
            materials: ({
                material: {
                    id: string;
                    name: string;
                };
            } & {
                quantity: number;
                stock_type: string | null;
                store_id: string;
                material_id: string;
            })[];
            customer: {
                id: string;
                name: string;
            } | null;
            service_engineer: {
                id: string;
                full_name: string;
            };
        } & {
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            invoice_number: string | null;
            store_number: string | null;
            service_engineer_id: string;
            customer_id: string | null;
            quantity: number;
            warranty_status: string;
            frame_number: string;
            return_status: string;
            inflow_status: string;
            stock_type: string | null;
            barcode: string | null;
            provider_name: string | null;
            remarks: string | null;
        };
        quantity_summary: any;
    }>;
    findByIdAndTechnician(id: string, technicianId: string): Promise<any>;
    updateByTechnician(id: string, technicianId: string, dto: UpdateStoreDto): Promise<{
        before: {
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            invoice_number: string | null;
            store_number: string | null;
            service_engineer_id: string;
            customer_id: string | null;
            quantity: number;
            warranty_status: string;
            frame_number: string;
            return_status: string;
            inflow_status: string;
            stock_type: string | null;
            barcode: string | null;
            provider_name: string | null;
            remarks: string | null;
        };
        after: {
            materials: ({
                material: {
                    id: string;
                    name: string;
                };
            } & {
                quantity: number;
                stock_type: string | null;
                store_id: string;
                material_id: string;
            })[];
            customer: {
                id: string;
                name: string;
            } | null;
            service_engineer: {
                id: string;
                full_name: string;
            };
        } & {
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            invoice_number: string | null;
            store_number: string | null;
            service_engineer_id: string;
            customer_id: string | null;
            quantity: number;
            warranty_status: string;
            frame_number: string;
            return_status: string;
            inflow_status: string;
            stock_type: string | null;
            barcode: string | null;
            provider_name: string | null;
            remarks: string | null;
        };
    }>;
    removeByTechnician(id: string, technicianId: string): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        invoice_number: string | null;
        store_number: string | null;
        service_engineer_id: string;
        customer_id: string | null;
        quantity: number;
        warranty_status: string;
        frame_number: string;
        return_status: string;
        inflow_status: string;
        stock_type: string | null;
        barcode: string | null;
        provider_name: string | null;
        remarks: string | null;
    }>;
    private extractCleanRemarks;
    private parseServiceTypeFromRemarks;
    private splitSerialsString;
    private cleanBarcodeString;
    private parseSerialMapFromRemarks;
    private constructRemarksFromProducts;
    calculateQuantitySummary(store: any): any;
    private invalidateCache;
}
