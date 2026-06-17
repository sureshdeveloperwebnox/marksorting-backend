/**
 * Installation Report Bulk Upload Interfaces
 *
 * Fully independent from master-mills and service-reports bulk upload domains.
 */

export interface InstallationReportPreviewRow {
    // Core
    mill_name: string;
    place: string;
    technician_names: string;       // comma-separated

    // Visit details
    visit_date: string;
    visit_time: string;
    call_registered_date: string;

    // Mill contact
    mill_whatsapp_number: string;
    mill_email: string;

    // Machine identification
    machine_model: string;
    serial_or_frame_no: string;
    authorized_person: string;
    authorized_person_phone: string;

    // Invoice / warranty
    invoice_number: string;
    invoice_date: string;
    warranty_start_date: string;
    warranty_end_date: string;

    // Performance
    commodity: string;
    contamination: string;
    output_capacity_per_hour: string;
    rejection_ratio: string;
    purity: string;
    no_of_programs_set: string;

    // Equipment
    ac_provided: string;                          // 'Yes' | 'No'
    compressor_details: string;
    air_drier_details: string;
    ground_earth_provided: string;                // 'Yes' | 'No'
    running_channel_combination: string;          // integer 1-12
    running_channel_combination_value: string;    // PRIMARY | SECONDARY | REJECTION_1 | REJECTION_2 | SPLIT
    no_of_filters_installed: string;
    oil_filter_condition: string;
    line_filter_condition: string;
    auto_drain_valve_working: string;             // 'Yes' | 'No'

    // Remarks
    engineer_remarks: string;
    customer_remarks: string;

    // Status
    status: string;

    // Validation
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
