/**
 * Service Report Bulk Upload Interfaces
 *
 * Mirrors the master-mills bulk upload interface structure but is scoped
 * to service report fields so the two domains remain fully independent.
 */

export interface ServiceReportPreviewRow {
  // Core identification
  mill_name: string;
  place: string;
  service_category_name: string;
  technician_names: string; // comma-separated

  // Visit details
  visit_date: string;
  visit_time: string;
  call_registered_date: string;

  // Mill contact
  mill_whatsapp_number: string;
  mill_email: string;

  // Machine info
  machine_model: string;
  machine_mfg_date: string;
  machine_installation_date: string;
  serial_or_frame_no: string;
  authorized_person: string;
  authorized_person_phone: string;
  previous_visit_engineer: string;

  // Complaint details
  nature_of_complaint: string;
  problem_observed: string;
  action_taken: string;

  // Machine performance
  commodity: string;
  contamination: string;
  output_capacity_per_hour: string;
  rejection_ratio: string;
  purity: string;
  no_of_programs_set: string;

  // Equipment status
  ac_provided: string; // 'Yes' | 'No'
  compressor_details: string;
  air_drier_details: string;
  line_filter_condition: string;
  machine_filter_condition: string;
  auto_drain_valve_working: string; // 'Yes' | 'No'

  // Remarks
  engineer_remarks: string;
  customer_remarks: string;

  // Status
  status: string;

  // Per-field validation errors: { fieldKey: "error message" }
  errors: Record<string, string>;

  // Derived — true when errors is empty
  isValid: boolean;

  // 0-based row index in the original file (for display)
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
