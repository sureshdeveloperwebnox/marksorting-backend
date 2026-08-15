import { StoresService } from './stores.service';
import { UpdateStoreReturnDto } from './dto/update-store-return.dto';
import { MobileCreateStoreDto } from './dto/mobile-create-store.dto';
import { MobileUpdateStoreDto } from './dto/mobile-update-store.dto';
export declare class MobileStoreReturnsController {
    private readonly storesService;
    constructor(storesService: StoresService);
    findAll(req: any, skip?: string, take?: string, search?: string): Promise<{
        stores: any;
        total: any;
    }>;
    submitReturn(id: string, dto: UpdateStoreReturnDto, req: any): Promise<{
        before: any;
        after: any;
    }>;
}
export declare class MobileStoresController {
    private readonly storesService;
    constructor(storesService: StoresService);
    findAll(req: any, skip?: string, take?: string, search?: string, return_status?: string, returnStatus?: string, inflow_status?: string, inflowStatus?: string, warranty_status?: string, warrantyStatus?: string): Promise<{
        stores: any;
        total: any;
    }>;
    submitReturn(id: string, dto: UpdateStoreReturnDto, req: any): Promise<{
        before: any;
        after: any;
    }>;
    submitReturnAlias(id: string, dto: UpdateStoreReturnDto, req: any): Promise<{
        before: any;
        after: any;
    }>;
    create(dto: MobileCreateStoreDto, req: any): Promise<any>;
    findOne(id: string, req: any): Promise<any>;
    update(id: string, dto: MobileUpdateStoreDto, req: any): Promise<{
        before: any;
        after: any;
    }>;
    remove(id: string, req: any): Promise<any>;
}
