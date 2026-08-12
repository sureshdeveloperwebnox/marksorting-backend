import { StoresService } from './stores.service';
import { UpdateStoreReturnDto } from './dto/update-store-return.dto';
import { MobileCreateStoreDto } from './dto/mobile-create-store.dto';
import { MobileUpdateStoreDto } from './dto/mobile-update-store.dto';
export declare class MobileStoreReturnsController {
    private readonly storesService;
    constructor(storesService: StoresService);
    findAll(req: any, skip?: string, take?: string, search?: string): Promise<{
        stores: ({
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
                quantity: number;
                store_id: string;
                material_id: string;
            })[];
        } & {
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            invoice_number: string | null;
            customer_id: string;
            service_engineer_id: string;
            remarks: string | null;
            quantity: number;
            warranty_status: string;
            frame_number: string;
            return_status: string;
            inflow_status: string;
            barcode: string | null;
            provider_name: string | null;
        })[];
        total: number;
    }>;
    submitReturn(id: string, dto: UpdateStoreReturnDto, req: any): Promise<{
        before: {
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            invoice_number: string | null;
            customer_id: string;
            service_engineer_id: string;
            remarks: string | null;
            quantity: number;
            warranty_status: string;
            frame_number: string;
            return_status: string;
            inflow_status: string;
            barcode: string | null;
            provider_name: string | null;
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
                quantity: number;
                store_id: string;
                material_id: string;
            })[];
        } & {
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            invoice_number: string | null;
            customer_id: string;
            service_engineer_id: string;
            remarks: string | null;
            quantity: number;
            warranty_status: string;
            frame_number: string;
            return_status: string;
            inflow_status: string;
            barcode: string | null;
            provider_name: string | null;
        };
    }>;
}
export declare class MobileStoresController {
    private readonly storesService;
    constructor(storesService: StoresService);
    findAll(req: any, skip?: string, take?: string, search?: string, return_status?: string, returnStatus?: string, inflow_status?: string, inflowStatus?: string, warranty_status?: string, warrantyStatus?: string): Promise<{
        stores: ({
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
                quantity: number;
                store_id: string;
                material_id: string;
            })[];
        } & {
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            invoice_number: string | null;
            customer_id: string;
            service_engineer_id: string;
            remarks: string | null;
            quantity: number;
            warranty_status: string;
            frame_number: string;
            return_status: string;
            inflow_status: string;
            barcode: string | null;
            provider_name: string | null;
        })[];
        total: number;
    }>;
    submitReturn(id: string, dto: UpdateStoreReturnDto, req: any): Promise<{
        before: {
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            invoice_number: string | null;
            customer_id: string;
            service_engineer_id: string;
            remarks: string | null;
            quantity: number;
            warranty_status: string;
            frame_number: string;
            return_status: string;
            inflow_status: string;
            barcode: string | null;
            provider_name: string | null;
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
                quantity: number;
                store_id: string;
                material_id: string;
            })[];
        } & {
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            invoice_number: string | null;
            customer_id: string;
            service_engineer_id: string;
            remarks: string | null;
            quantity: number;
            warranty_status: string;
            frame_number: string;
            return_status: string;
            inflow_status: string;
            barcode: string | null;
            provider_name: string | null;
        };
    }>;
    submitReturnAlias(id: string, dto: UpdateStoreReturnDto, req: any): Promise<{
        before: {
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            invoice_number: string | null;
            customer_id: string;
            service_engineer_id: string;
            remarks: string | null;
            quantity: number;
            warranty_status: string;
            frame_number: string;
            return_status: string;
            inflow_status: string;
            barcode: string | null;
            provider_name: string | null;
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
                quantity: number;
                store_id: string;
                material_id: string;
            })[];
        } & {
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            invoice_number: string | null;
            customer_id: string;
            service_engineer_id: string;
            remarks: string | null;
            quantity: number;
            warranty_status: string;
            frame_number: string;
            return_status: string;
            inflow_status: string;
            barcode: string | null;
            provider_name: string | null;
        };
    }>;
    create(dto: MobileCreateStoreDto, req: any): Promise<{
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
            quantity: number;
            store_id: string;
            material_id: string;
        })[];
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        invoice_number: string | null;
        customer_id: string;
        service_engineer_id: string;
        remarks: string | null;
        quantity: number;
        warranty_status: string;
        frame_number: string;
        return_status: string;
        inflow_status: string;
        barcode: string | null;
        provider_name: string | null;
    }>;
    findOne(id: string, req: any): Promise<any>;
    update(id: string, dto: MobileUpdateStoreDto, req: any): Promise<{
        before: {
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            invoice_number: string | null;
            customer_id: string;
            service_engineer_id: string;
            remarks: string | null;
            quantity: number;
            warranty_status: string;
            frame_number: string;
            return_status: string;
            inflow_status: string;
            barcode: string | null;
            provider_name: string | null;
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
                quantity: number;
                store_id: string;
                material_id: string;
            })[];
        } & {
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            invoice_number: string | null;
            customer_id: string;
            service_engineer_id: string;
            remarks: string | null;
            quantity: number;
            warranty_status: string;
            frame_number: string;
            return_status: string;
            inflow_status: string;
            barcode: string | null;
            provider_name: string | null;
        };
    }>;
    remove(id: string, req: any): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        invoice_number: string | null;
        customer_id: string;
        service_engineer_id: string;
        remarks: string | null;
        quantity: number;
        warranty_status: string;
        frame_number: string;
        return_status: string;
        inflow_status: string;
        barcode: string | null;
        provider_name: string | null;
    }>;
}
