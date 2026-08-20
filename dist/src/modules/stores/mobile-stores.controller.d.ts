import { StoresService } from './stores.service';
import { UpdateStoreReturnDto } from './dto/update-store-return.dto';
import { MobileCreateStoreDto } from './dto/mobile-create-store.dto';
import { MobileUpdateStoreDto } from './dto/mobile-update-store.dto';
export declare class MobileStoreReturnsController {
    private readonly storesService;
    constructor(storesService: StoresService);
    findAll(req: any, skip?: string, take?: string, search?: string): Promise<{
        stores: any[];
        total: number;
    }>;
    findOne(id: string, req: any): Promise<any>;
    submitReturn(id: string, dto: UpdateStoreReturnDto, req: any): Promise<{
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
    submitReturnDetailsAlias1(id: string, dto: UpdateStoreReturnDto, req: any): Promise<{
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
    submitReturnDetailsAlias2(id: string, dto: UpdateStoreReturnDto, req: any): Promise<{
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
    submitReturnDetailsAlias3(id: string, dto: UpdateStoreReturnDto, req: any): Promise<{
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
}
export declare class MobileStoresController {
    private readonly storesService;
    constructor(storesService: StoresService);
    findAll(req: any, skip?: string, take?: string, search?: string, return_status?: string, returnStatus?: string, inflow_status?: string, inflowStatus?: string, warranty_status?: string, warrantyStatus?: string): Promise<{
        stores: any[];
        total: number;
    }>;
    findReturns(req: any, skip?: string, take?: string, page?: string, limit?: string, search?: string, status?: string): Promise<{
        stores: any[];
        total: number;
    }>;
    submitReturnPath1(id: string, dto: UpdateStoreReturnDto, req: any): Promise<{
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
    submitReturnPath2(id: string, dto: UpdateStoreReturnDto, req: any): Promise<{
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
    submitReturnPath3(id: string, dto: UpdateStoreReturnDto, req: any): Promise<{
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
    submitReturn(id: string, dto: UpdateStoreReturnDto, req: any): Promise<{
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
    submitReturnAlias(id: string, dto: UpdateStoreReturnDto, req: any): Promise<{
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
    create(dto: MobileCreateStoreDto, req: any): Promise<{
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
    findOne(id: string, req: any): Promise<any>;
    update(id: string, dto: MobileUpdateStoreDto, req: any): Promise<{
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
    remove(id: string, req: any): Promise<{
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
}
