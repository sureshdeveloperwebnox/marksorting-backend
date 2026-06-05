export declare class CreateStoreDto {
    service_engineer_id: string;
    customer_id: string;
    material_ids: string[];
    quantity: number;
    warranty_status: string;
    frame_number: string;
    return_status: string;
    inflow_status: string;
    barcode?: string;
    provider_name?: string;
    invoice_number?: string;
}
