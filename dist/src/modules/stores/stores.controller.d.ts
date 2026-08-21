import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { UpdateStoreReturnDto } from './dto/update-store-return.dto';
export declare class StoresController {
    private readonly storesService;
    constructor(storesService: StoresService);
    findAll(skip?: string, take?: string, search?: string, serviceEngineerId?: string, serviceEngineerIdCamel?: string, customerId?: string, customerIdCamel?: string, materialId?: string, materialIdCamel?: string, warrantyStatus?: string, warrantyStatusCamel?: string, returnStatus?: string, returnStatusCamel?: string, inflowStatus?: string, inflowStatusCamel?: string, stockType?: string, stockTypeCamel?: string, dateFrom?: string, dateTo?: string): Promise<any>;
    findReturns(req: any, skip?: string, take?: string, page?: string, limit?: string, search?: string, status?: string, returnStatus?: string): Promise<{
        stores: any[];
        total: number;
    }>;
    findOne(id: string): Promise<any>;
    create(dto: CreateStoreDto, req: any): Promise<any>;
    submitReturnDetailsPath1(id: string, dto: UpdateStoreReturnDto, req: any): Promise<{
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
    submitReturnDetailsPath2(id: string, dto: UpdateStoreReturnDto, req: any): Promise<{
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
    submitReturnDetailsPath3(id: string, dto: UpdateStoreReturnDto, req: any): Promise<{
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
    submitReturnDetailsPath4(id: string, dto: UpdateStoreReturnDto, req: any): Promise<{
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
    update(id: string, dto: UpdateStoreDto, req: any): Promise<any>;
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
}
