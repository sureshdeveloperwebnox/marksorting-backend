import { StoresService } from './stores.service';
import { UpdateStoreReturnDto } from './dto/update-store-return.dto';
export declare class MobileStoresController {
    private readonly storesService;
    constructor(storesService: StoresService);
    findAll(req: any, skip?: string, take?: string, search?: string): Promise<{
        stores: ({
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
        })[];
        total: number;
    }>;
    submitReturn(id: string, dto: UpdateStoreReturnDto, req: any): Promise<{
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
}
