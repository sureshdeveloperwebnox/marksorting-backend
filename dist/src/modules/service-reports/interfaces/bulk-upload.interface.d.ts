export interface ServiceReportPreviewRow {
    mill_name: string;
    place: string;
    service_category_name: string;
    technician_names: string;
    visit_date: string;
    visit_time: string;
    call_registered_date: string;
    mill_whatsapp_number: string;
    mill_email: string;
    machine_model: string;
    machine_mfg_date: string;
    machine_installation_date: string;
    serial_or_frame_no: string;
    authorized_person: string;
    authorized_person_phone: string;
    previous_visit_engineer: string;
    nature_of_complaint: string;
    problem_observed: string;
    action_taken: string;
    commodity: string;
    contamination: string;
    output_capacity_per_hour: string;
    rejection_ratio: string;
    purity: string;
    no_of_programs_set: string;
    ac_provided: string;
    compressor_details: string;
    air_drier_details: string;
    line_filter_condition: string;
    machine_filter_condition: string;
    auto_drain_valve_working: string;
    engineer_remarks: string;
    customer_remarks: string;
    status: string;
    errors: Record<string, string>;
    isValid: boolean;
    rowIndex: number;
}
export interface ServiceReportPreviewResponse {
    importId: string;
    rows: ServiceReportPreviewRow[];
    totalRows: number;
    validRows: number;
    invalidRows: number;
}
export interface ServiceReportImportStatus {
    state: 'processing' | 'completed' | 'failed';
    percentage: number;
    processedRows: number;
    createdCount: number;
    errorCount: number;
    errorMessage?: string;
}
