import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
export declare class StoresController {
    private readonly storesService;
    constructor(storesService: StoresService);
    findAll(skip?: string, take?: string, search?: string, serviceEngineerId?: string, customerId?: string, materialId?: string, warrantyStatus?: string, returnStatus?: string, inflowStatus?: string): Promise<any>;
    findOne(id: string): Promise<any>;
    create(dto: CreateStoreDto): Promise<{
        service_engineer: {
            id: string;
            full_name: string;
        };
        customer: {
            id: string;
            name: string;
        };
        materials: ({
            material: {
                id: string;
                name: string;
            };
        } & {
            store_id: string;
            material_id: string;
        })[];
    } & {
        created_at: Date;
        id: string;
        service_engineer_id: string;
        customer_id: string;
        quantity: number;
        warranty_status: string;
        frame_number: string;
        return_status: string;
        inflow_status: string;
        barcode: string | null;
        updated_at: Date;
        deleted_at: Date | null;
    }>;
    update(id: string, dto: UpdateStoreDto): Promise<{
        before: {
            created_at: Date;
            id: string;
            service_engineer_id: string;
            customer_id: string;
            quantity: number;
            warranty_status: string;
            frame_number: string;
            return_status: string;
            inflow_status: string;
            barcode: string | null;
            updated_at: Date;
            deleted_at: Date | null;
        };
        after: {
            service_engineer: {
                id: string;
                full_name: string;
            };
            customer: {
                id: string;
                name: string;
            };
            materials: ({
                material: {
                    id: string;
                    name: string;
                };
            } & {
                store_id: string;
                material_id: string;
            })[];
        } & {
            created_at: Date;
            id: string;
            service_engineer_id: string;
            customer_id: string;
            quantity: number;
            warranty_status: string;
            frame_number: string;
            return_status: string;
            inflow_status: string;
            barcode: string | null;
            updated_at: Date;
            deleted_at: Date | null;
        };
    }>;
    remove(id: string): Promise<{
        created_at: Date;
        id: string;
        service_engineer_id: string;
        customer_id: string;
        quantity: number;
        warranty_status: string;
        frame_number: string;
        return_status: string;
        inflow_status: string;
        barcode: string | null;
        updated_at: Date;
        deleted_at: Date | null;
    }>;
}
