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
    submitReturn(id: string, dto: UpdateStoreReturnDto, req: any): Promise<any>;
    submitReturnDetailsAlias1(id: string, dto: UpdateStoreReturnDto, req: any): Promise<any>;
    submitReturnDetailsAlias2(id: string, dto: UpdateStoreReturnDto, req: any): Promise<any>;
    submitReturnDetailsAlias3(id: string, dto: UpdateStoreReturnDto, req: any): Promise<any>;
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
    submitReturnPath1(id: string, dto: UpdateStoreReturnDto, req: any): Promise<any>;
    submitReturnPath2(id: string, dto: UpdateStoreReturnDto, req: any): Promise<any>;
    submitReturnPath3(id: string, dto: UpdateStoreReturnDto, req: any): Promise<any>;
    submitReturn(id: string, dto: UpdateStoreReturnDto, req: any): Promise<any>;
    submitReturnAlias(id: string, dto: UpdateStoreReturnDto, req: any): Promise<any>;
    create(dto: MobileCreateStoreDto, req: any): Promise<any>;
    findOne(id: string, req: any): Promise<any>;
    update(id: string, dto: MobileUpdateStoreDto, req: any): Promise<any>;
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
