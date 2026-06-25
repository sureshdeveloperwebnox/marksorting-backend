import { StoresService } from './stores.service';
import { UpdateStoreReturnDto } from './dto/update-store-return.dto';
import { MobileCreateStoreDto } from './dto/mobile-create-store.dto';
import { MobileUpdateStoreDto } from './dto/mobile-update-store.dto';
export declare class MobileStoreReturnsController {
    private readonly storesService;
    constructor(storesService: StoresService);
    findAll(req: any, skip?: string, take?: string, search?: string): Promise<{
        stores: ({
            materials: ({
                material: {
                    id: string;
                    name: string;
                };
            } & {
                store_id: string;
                material_id: string;
            })[];
            customer: {
                id: string;
                name: string;
            };
            service_engineer: {
                id: string;
                full_name: string;
            };
        } & {
            id: string;
            service_engineer_id: string;
            customer_id: string;
            quantity: number;
            warranty_status: string;
            frame_number: string;
            return_status: string;
            inflow_status: string;
            barcode: string | null;
            provider_name: string | null;
            invoice_number: string | null;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
        })[];
        total: number;
    }>;
    submitReturn(id: string, dto: UpdateStoreReturnDto, req: any): Promise<{
        before: {
            id: string;
            service_engineer_id: string;
            customer_id: string;
            quantity: number;
            warranty_status: string;
            frame_number: string;
            return_status: string;
            inflow_status: string;
            barcode: string | null;
            provider_name: string | null;
            invoice_number: string | null;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
        };
        after: {
            materials: ({
                material: {
                    id: string;
                    name: string;
                };
            } & {
                store_id: string;
                material_id: string;
            })[];
            customer: {
                id: string;
                name: string;
            };
            service_engineer: {
                id: string;
                full_name: string;
            };
        } & {
            id: string;
            service_engineer_id: string;
            customer_id: string;
            quantity: number;
            warranty_status: string;
            frame_number: string;
            return_status: string;
            inflow_status: string;
            barcode: string | null;
            provider_name: string | null;
            invoice_number: string | null;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
        };
    }>;
}
export declare class MobileStoresController {
    private readonly storesService;
    constructor(storesService: StoresService);
    findAll(req: any, skip?: string, take?: string, search?: string, return_status?: string, returnStatus?: string, inflow_status?: string, inflowStatus?: string, warranty_status?: string, warrantyStatus?: string): Promise<{
        stores: ({
            materials: ({
                material: {
                    id: string;
                    name: string;
                };
            } & {
                store_id: string;
                material_id: string;
            })[];
            customer: {
                id: string;
                name: string;
            };
            service_engineer: {
                id: string;
                full_name: string;
            };
        } & {
            id: string;
            service_engineer_id: string;
            customer_id: string;
            quantity: number;
            warranty_status: string;
            frame_number: string;
            return_status: string;
            inflow_status: string;
            barcode: string | null;
            provider_name: string | null;
            invoice_number: string | null;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
        })[];
        total: number;
    }>;
    submitReturn(id: string, dto: UpdateStoreReturnDto, req: any): Promise<{
        before: {
            id: string;
            service_engineer_id: string;
            customer_id: string;
            quantity: number;
            warranty_status: string;
            frame_number: string;
            return_status: string;
            inflow_status: string;
            barcode: string | null;
            provider_name: string | null;
            invoice_number: string | null;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
        };
        after: {
            materials: ({
                material: {
                    id: string;
                    name: string;
                };
            } & {
                store_id: string;
                material_id: string;
            })[];
            customer: {
                id: string;
                name: string;
            };
            service_engineer: {
                id: string;
                full_name: string;
            };
        } & {
            id: string;
            service_engineer_id: string;
            customer_id: string;
            quantity: number;
            warranty_status: string;
            frame_number: string;
            return_status: string;
            inflow_status: string;
            barcode: string | null;
            provider_name: string | null;
            invoice_number: string | null;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
        };
    }>;
    submitReturnAlias(id: string, dto: UpdateStoreReturnDto, req: any): Promise<{
        before: {
            id: string;
            service_engineer_id: string;
            customer_id: string;
            quantity: number;
            warranty_status: string;
            frame_number: string;
            return_status: string;
            inflow_status: string;
            barcode: string | null;
            provider_name: string | null;
            invoice_number: string | null;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
        };
        after: {
            materials: ({
                material: {
                    id: string;
                    name: string;
                };
            } & {
                store_id: string;
                material_id: string;
            })[];
            customer: {
                id: string;
                name: string;
            };
            service_engineer: {
                id: string;
                full_name: string;
            };
        } & {
            id: string;
            service_engineer_id: string;
            customer_id: string;
            quantity: number;
            warranty_status: string;
            frame_number: string;
            return_status: string;
            inflow_status: string;
            barcode: string | null;
            provider_name: string | null;
            invoice_number: string | null;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
        };
    }>;
    create(dto: MobileCreateStoreDto, req: any): Promise<{
        materials: ({
            material: {
                id: string;
                name: string;
            };
        } & {
            store_id: string;
            material_id: string;
        })[];
        customer: {
            id: string;
            name: string;
        };
        service_engineer: {
            id: string;
            full_name: string;
        };
    } & {
        id: string;
        service_engineer_id: string;
        customer_id: string;
        quantity: number;
        warranty_status: string;
        frame_number: string;
        return_status: string;
        inflow_status: string;
        barcode: string | null;
        provider_name: string | null;
        invoice_number: string | null;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
    }>;
    findOne(id: string, req: any): Promise<any>;
    update(id: string, dto: MobileUpdateStoreDto, req: any): Promise<{
        before: {
            id: string;
            service_engineer_id: string;
            customer_id: string;
            quantity: number;
            warranty_status: string;
            frame_number: string;
            return_status: string;
            inflow_status: string;
            barcode: string | null;
            provider_name: string | null;
            invoice_number: string | null;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
        };
        after: {
            materials: ({
                material: {
                    id: string;
                    name: string;
                };
            } & {
                store_id: string;
                material_id: string;
            })[];
            customer: {
                id: string;
                name: string;
            };
            service_engineer: {
                id: string;
                full_name: string;
            };
        } & {
            id: string;
            service_engineer_id: string;
            customer_id: string;
            quantity: number;
            warranty_status: string;
            frame_number: string;
            return_status: string;
            inflow_status: string;
            barcode: string | null;
            provider_name: string | null;
            invoice_number: string | null;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
        };
    }>;
    remove(id: string, req: any): Promise<{
        id: string;
        service_engineer_id: string;
        customer_id: string;
        quantity: number;
        warranty_status: string;
        frame_number: string;
        return_status: string;
        inflow_status: string;
        barcode: string | null;
        provider_name: string | null;
        invoice_number: string | null;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
    }>;
}
