export interface InstallationReportPreviewRow {
    mill_name: string;
    place: string;
    technician_names: string;
    visit_date: string;
    visit_time: string;
    call_registered_date: string;
    mill_whatsapp_number: string;
    mill_email: string;
    machine_model: string;
    machine_mfg_date: string;
    serial_or_frame_no: string;
    authorized_person: string;
    authorized_person_phone: string;
    invoice_number: string;
    invoice_date: string;
    warranty_start_date: string;
    warranty_end_date: string;
    commodity: string;
    contamination: string;
    output_capacity_per_hour: string;
    rejection_ratio: string;
    purity: string;
    no_of_programs_set: string;
    ac_provided: string;
    compressor_details: string;
    air_drier_details: string;
    ground_earth_provided: string;
    running_channel_combination: string;
    running_channel_combination_value: string;
    no_of_filters_installed: string;
    oil_filter_condition: string;
    line_filter_condition: string;
    auto_drain_valve_working: string;
    engineer_remarks: string;
    customer_remarks: string;
    status: string;
    errors: Record<string, string>;
    isValid: boolean;
    rowIndex: number;
}
export interface InstallationReportPreviewResponse {
    importId: string;
    rows: InstallationReportPreviewRow[];
    totalRows: number;
    validRows: number;
    invalidRows: number;
}
export interface InstallationReportImportStatus {
    state: 'processing' | 'completed' | 'failed';
    percentage: number;
    processedRows: number;
    createdCount: number;
    errorCount: number;
    errorMessage?: string;
}
