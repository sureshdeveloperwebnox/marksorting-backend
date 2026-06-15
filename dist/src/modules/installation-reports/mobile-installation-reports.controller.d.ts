import type { Response } from 'express';
import { InstallationReportsService } from './installation-reports.service';
import { CreateMobileInstallationReportDto } from './dto/create-mobile-installation-report.dto';
import { UpdateMobileInstallationReportDto } from './dto/update-mobile-installation-report.dto';
export declare class MobileInstallationReportsController {
    private readonly installationReportsService;
    constructor(installationReportsService: InstallationReportsService);
    findAll(req: any, skip?: string, take?: string, search?: string, status?: string, dateFrom?: string, dateTo?: string): Promise<any>;
    findOne(id: string, req: any): Promise<any>;
    create(dto: CreateMobileInstallationReportDto, req: any): Promise<({
        mill: {
            id: string;
            name: string;
            customer: {
                id: string;
                name: string;
            } | null;
        };
        technicians: ({
            technician: {
                id: string;
                full_name: string;
            };
        } & {
            technician_id: string;
            installation_report_id: string;
        })[];
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        status: string;
        report_number: string;
        mill_id: string;
        place: string;
        mill_whatsapp_number: string;
        mill_email: string | null;
        visit_date: Date;
        visit_time: string;
        call_registered_date: Date;
        machine_model: string;
        serial_or_frame_no: string;
        authorized_person: string;
        authorized_person_phone: string | null;
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
        invoice_number: string | null;
        invoice_date: Date | null;
        warranty_start_date: Date | null;
        warranty_end_date: Date | null;
        ground_earth_provided: boolean;
        ground_earth_value: number | null;
        ground_earth_field: string | null;
        no_of_filters_installed: number | null;
        oil_filter_condition: string | null;
    }) | null>;
    update(id: string, dto: UpdateMobileInstallationReportDto, req: any): Promise<{
        before: any;
        after: {
            mill: {
                id: string;
                name: string;
                customer: {
                    id: string;
                    name: string;
                } | null;
            };
            technicians: ({
                technician: {
                    id: string;
                    full_name: string;
                };
            } & {
                technician_id: string;
                installation_report_id: string;
            })[];
        } & {
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            status: string;
            report_number: string;
            mill_id: string;
            place: string;
            mill_whatsapp_number: string;
            mill_email: string | null;
            visit_date: Date;
            visit_time: string;
            call_registered_date: Date;
            machine_model: string;
            serial_or_frame_no: string;
            authorized_person: string;
            authorized_person_phone: string | null;
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
            invoice_number: string | null;
            invoice_date: Date | null;
            warranty_start_date: Date | null;
            warranty_end_date: Date | null;
            ground_earth_provided: boolean;
            ground_earth_value: number | null;
            ground_earth_field: string | null;
            no_of_filters_installed: number | null;
            oil_filter_condition: string | null;
        };
    }>;
    remove(id: string, req: any): Promise<{
        mill: {
            id: string;
            name: string;
            customer: {
                id: string;
                name: string;
            } | null;
        };
        technicians: ({
            technician: {
                id: string;
                full_name: string;
            };
        } & {
            technician_id: string;
            installation_report_id: string;
        })[];
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        status: string;
        report_number: string;
        mill_id: string;
        place: string;
        mill_whatsapp_number: string;
        mill_email: string | null;
        visit_date: Date;
        visit_time: string;
        call_registered_date: Date;
        machine_model: string;
        serial_or_frame_no: string;
        authorized_person: string;
        authorized_person_phone: string | null;
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
        invoice_number: string | null;
        invoice_date: Date | null;
        warranty_start_date: Date | null;
        warranty_end_date: Date | null;
        ground_earth_provided: boolean;
        ground_earth_value: number | null;
        ground_earth_field: string | null;
        no_of_filters_installed: number | null;
        oil_filter_condition: string | null;
    }>;
    downloadPdf(id: string, req: any, res: Response): Promise<void>;
}
