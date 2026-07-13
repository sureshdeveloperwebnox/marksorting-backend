export interface PreviewRow {
    invoice_no: string;
    type: string;
    invoice_date: string;
    ref_no: string;
    frame_no: string;
    mfg_date: string;
    mc_model: string;
    mill_name: string;
    customer_name: string;
    place: string;
    state: string;
    phone_no: string;
    address: string;
    installation_date: string;
    warranty_start_date: string;
    warranty_years: string;
    warranty_months: string;
    amc_starting_date: string;
    amc_closing_date: string;
    amc_period: string;
    amc_amount: string;
    amc_particulars: string;
    errors: Record<string, string>;
    isValid: boolean;
    rowIndex: number;
}
export interface PreviewResponse {
    importId: string;
    rows: PreviewRow[];
    totalRows: number;
    validRows: number;
    invalidRows: number;
}
export interface ImportStatus {
    state: 'processing' | 'completed' | 'failed';
    percentage: number;
    processedRows: number;
    createdCount: number;
    updatedCount: number;
    errorCount: number;
    errorMessage?: string;
}
export interface ColumnConfig {
    key: keyof PreviewRow;
    header: string;
    width?: number;
}
