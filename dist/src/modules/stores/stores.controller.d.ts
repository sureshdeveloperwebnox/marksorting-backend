import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
export declare class StoresController {
    private readonly storesService;
    constructor(storesService: StoresService);
    findAll(skip?: string, take?: string, search?: string, serviceEngineerId?: string, serviceEngineerIdCamel?: string, customerId?: string, customerIdCamel?: string, materialId?: string, materialIdCamel?: string, warrantyStatus?: string, warrantyStatusCamel?: string, returnStatus?: string, returnStatusCamel?: string, inflowStatus?: string, inflowStatusCamel?: string): Promise<any>;
    findOne(id: string): Promise<any>;
    create(dto: CreateStoreDto): Promise<{
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
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
    }>;
    update(id: string, dto: UpdateStoreDto): Promise<{
        before: {
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
            id: string;
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
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
        };
    }>;
    remove(id: string): Promise<{
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
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
    }>;
}
