import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
export declare class StoresController {
    private readonly storesService;
    constructor(storesService: StoresService);
    findAll(skip?: string, take?: string, search?: string, serviceEngineerId?: string, serviceEngineerIdCamel?: string, customerId?: string, customerIdCamel?: string, materialId?: string, materialIdCamel?: string, warrantyStatus?: string, warrantyStatusCamel?: string, returnStatus?: string, returnStatusCamel?: string, inflowStatus?: string, inflowStatusCamel?: string, dateFrom?: string, dateTo?: string): Promise<any>;
    findOne(id: string): Promise<any>;
    create(dto: CreateStoreDto): Promise<{
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
        invoice_number: string | null;
        service_engineer_id: string;
        warranty_status: string;
        return_status: string;
        inflow_status: string;
        barcode: string | null;
        frame_number: string;
        quantity: number;
        provider_name: string | null;
    }>;
    update(id: string, dto: UpdateStoreDto): Promise<{
        before: {
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            customer_id: string;
            invoice_number: string | null;
            service_engineer_id: string;
            warranty_status: string;
            return_status: string;
            inflow_status: string;
            barcode: string | null;
            frame_number: string;
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
            invoice_number: string | null;
            service_engineer_id: string;
            warranty_status: string;
            return_status: string;
            inflow_status: string;
            barcode: string | null;
            frame_number: string;
            quantity: number;
            provider_name: string | null;
        };
    }>;
    remove(id: string): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        customer_id: string;
        invoice_number: string | null;
        service_engineer_id: string;
        warranty_status: string;
        return_status: string;
        inflow_status: string;
        barcode: string | null;
        frame_number: string;
        quantity: number;
        provider_name: string | null;
    }>;
}
