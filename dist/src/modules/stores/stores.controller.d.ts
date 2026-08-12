import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
export declare class StoresController {
    private readonly storesService;
    constructor(storesService: StoresService);
    findAll(skip?: string, take?: string, search?: string, serviceEngineerId?: string, serviceEngineerIdCamel?: string, customerId?: string, customerIdCamel?: string, materialId?: string, materialIdCamel?: string, warrantyStatus?: string, warrantyStatusCamel?: string, returnStatus?: string, returnStatusCamel?: string, inflowStatus?: string, inflowStatusCamel?: string, dateFrom?: string, dateTo?: string): Promise<any>;
    findOne(id: string): Promise<any>;
    create(dto: CreateStoreDto): Promise<any>;
    update(id: string, dto: UpdateStoreDto): Promise<{
        before: any;
        after: any;
    }>;
    remove(id: string): Promise<any>;
}
