import type { Response } from 'express';
import { InstallationReportsService } from './installation-reports.service';
import { CreateInstallationReportDto } from './dto/create-installation-report.dto';
import { UpdateInstallationReportDto } from './dto/update-installation-report.dto';
export declare class InstallationReportsController {
    private readonly installationReportsService;
    constructor(installationReportsService: InstallationReportsService);
    findAll(req: any, skip?: string, take?: string, search?: string, status?: string, technicianId?: string, customerId?: string, millId?: string, dateFrom?: string, dateTo?: string): Promise<any>;
    downloadPdf(id: string, req: any, res: Response): Promise<void>;
    findOne(id: string, req: any): Promise<any>;
    create(dto: CreateInstallationReportDto, req: any): Promise<({
        technicians: ({
            technician: {
                id: string;
                full_name: string;
            };
        } & {
            installation_report_id: string;
            technician_id: string;
        })[];
        mill: {
            id: string;
            name: string;
            customer: {
                id: string;
                name: string;
            } | null;
        };
    } & {
        id: string;
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        mill_id: string;
        place: string;
        visit_date: Date;
        visit_time: string;
        expense_id: string | null;
        report_number: string;
        mill_whatsapp_number: string;
        mill_email: string | null;
        call_registered_date: Date;
        machine_model: string;
        machine_mfg_date: Date | null;
        serial_or_frame_no: string;
        authorized_person: string;
        commodity: string | null;
        contamination: string | null;
        output_capacity_per_hour: string | null;
        rejection_ratio: string | null;
        purity: string | null;
        no_of_programs_set: number | null;
        ac_provided: boolean;
        compressor_details: string | null;
        air_drier_details: string | null;
        line_filter_condition: string | null;
        auto_drain_valve_working: boolean;
        engineer_remarks: string;
        engineer_signature: string;
        customer_remarks: string | null;
        customer_signature: string;
        authorized_person_phone: string | null;
        invoice_number: string | null;
        invoice_date: Date | null;
        warranty_start_date: Date | null;
        warranty_end_date: Date | null;
        ground_earth_provided: boolean;
        running_channel_combination: number | null;
        running_channel_combination_value: string | null;
        no_of_filters_installed: number | null;
        oil_filter_condition: string | null;
    }) | null>;
    update(id: string, dto: UpdateInstallationReportDto, req: any): Promise<{
        before: any;
        after: {
            technicians: ({
                technician: {
                    id: string;
                    full_name: string;
                };
            } & {
                installation_report_id: string;
                technician_id: string;
            })[];
            mill: {
                id: string;
                name: string;
                customer: {
                    id: string;
                    name: string;
                } | null;
            };
        } & {
            id: string;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            mill_id: string;
            place: string;
            visit_date: Date;
            visit_time: string;
            expense_id: string | null;
            report_number: string;
            mill_whatsapp_number: string;
            mill_email: string | null;
            call_registered_date: Date;
            machine_model: string;
            machine_mfg_date: Date | null;
            serial_or_frame_no: string;
            authorized_person: string;
            commodity: string | null;
            contamination: string | null;
            output_capacity_per_hour: string | null;
            rejection_ratio: string | null;
            purity: string | null;
            no_of_programs_set: number | null;
            ac_provided: boolean;
            compressor_details: string | null;
            air_drier_details: string | null;
            line_filter_condition: string | null;
            auto_drain_valve_working: boolean;
            engineer_remarks: string;
            engineer_signature: string;
            customer_remarks: string | null;
            customer_signature: string;
            authorized_person_phone: string | null;
            invoice_number: string | null;
            invoice_date: Date | null;
            warranty_start_date: Date | null;
            warranty_end_date: Date | null;
            ground_earth_provided: boolean;
            running_channel_combination: number | null;
            running_channel_combination_value: string | null;
            no_of_filters_installed: number | null;
            oil_filter_condition: string | null;
        };
    }>;
    remove(id: string, req: any): Promise<{
        technicians: ({
            technician: {
                id: string;
                full_name: string;
            };
        } & {
            installation_report_id: string;
            technician_id: string;
        })[];
        mill: {
            id: string;
            name: string;
            customer: {
                id: string;
                name: string;
            } | null;
        };
    } & {
        id: string;
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        mill_id: string;
        place: string;
        visit_date: Date;
        visit_time: string;
        expense_id: string | null;
        report_number: string;
        mill_whatsapp_number: string;
        mill_email: string | null;
        call_registered_date: Date;
        machine_model: string;
        machine_mfg_date: Date | null;
        serial_or_frame_no: string;
        authorized_person: string;
        commodity: string | null;
        contamination: string | null;
        output_capacity_per_hour: string | null;
        rejection_ratio: string | null;
        purity: string | null;
        no_of_programs_set: number | null;
        ac_provided: boolean;
        compressor_details: string | null;
        air_drier_details: string | null;
        line_filter_condition: string | null;
        auto_drain_valve_working: boolean;
        engineer_remarks: string;
        engineer_signature: string;
        customer_remarks: string | null;
        customer_signature: string;
        authorized_person_phone: string | null;
        invoice_number: string | null;
        invoice_date: Date | null;
        warranty_start_date: Date | null;
        warranty_end_date: Date | null;
        ground_earth_provided: boolean;
        running_channel_combination: number | null;
        running_channel_combination_value: string | null;
        no_of_filters_installed: number | null;
        oil_filter_condition: string | null;
    }>;
}
