import { StoresService } from './stores.service';
import { UpdateStoreReturnDto } from './dto/update-store-return.dto';
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
            invoice_number: string | null;
            service_engineer_id: string;
            quantity: number;
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
            customer_id: string;
            frame_number: string;
            barcode: string | null;
            warranty_status: string;
            return_status: string;
            inflow_status: string;
            invoice_number: string | null;
            service_engineer_id: string;
            quantity: number;
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
            invoice_number: string | null;
            service_engineer_id: string;
            quantity: number;
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
            invoice_number: string | null;
            service_engineer_id: string;
            quantity: number;
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
            customer_id: string;
            frame_number: string;
            barcode: string | null;
            warranty_status: string;
            return_status: string;
            inflow_status: string;
            invoice_number: string | null;
            service_engineer_id: string;
            quantity: number;
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
            invoice_number: string | null;
            service_engineer_id: string;
            quantity: number;
            provider_name: string | null;
        };
    }>;
    submitReturnAlias(id: string, dto: UpdateStoreReturnDto, req: any): Promise<{
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
            invoice_number: string | null;
            service_engineer_id: string;
            quantity: number;
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
            invoice_number: string | null;
            service_engineer_id: string;
            quantity: number;
            provider_name: string | null;
        };
    }>;
}
