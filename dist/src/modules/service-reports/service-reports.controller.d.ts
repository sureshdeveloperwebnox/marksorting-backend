import type { Response } from 'express';
import { ServiceReportsService } from './service-reports.service';
import { CreateServiceReportDto } from './dto/create-service-report.dto';
import { UpdateServiceReportDto } from './dto/update-service-report.dto';
export declare class ServiceReportsController {
    private readonly serviceReportsService;
    constructor(serviceReportsService: ServiceReportsService);
    findAll(skip?: string, take?: string, search?: string, status?: string, serviceCategoryId?: string, dateFrom?: string, dateTo?: string): Promise<any>;
    downloadPdf(id: string, res: Response): Promise<void>;
    findOne(id: string): Promise<any>;
    create(dto: CreateServiceReportDto): Promise<({
        mill: {
            name: string;
            id: string;
        };
        serviceCategory: {
            name: string;
            id: string;
        };
        technicians: ({
            technician: {
                full_name: string;
                id: string;
            };
        } & {
            service_report_id: string;
            technician_id: string;
        })[];
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        status: string;
        service_category_id: string;
        mill_id: string;
        place: string;
        mill_whatsapp_number: string;
        visit_date: Date;
        visit_time: string;
        call_registered_date: Date;
        machine_model: string;
        serial_or_frame_no: string;
        authorized_person: string;
        nature_of_complaint: string;
        action_taken: string;
        engineer_remarks: string;
        engineer_signature: string;
        customer_signature: string;
        mill_email: string | null;
        machine_mfg_date: Date | null;
        machine_installation_date: Date | null;
        previous_visit_engineer: string | null;
        problem_observed: string | null;
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
        machine_filter_condition: string | null;
        auto_drain_valve_working: boolean;
        customer_remarks: string | null;
        report_number: string;
    }) | null>;
    update(id: string, dto: UpdateServiceReportDto): Promise<{
        mill: {
            name: string;
            id: string;
        };
        serviceCategory: {
            name: string;
            id: string;
        };
        technicians: ({
            technician: {
                full_name: string;
                id: string;
            };
        } & {
            service_report_id: string;
            technician_id: string;
        })[];
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        status: string;
        service_category_id: string;
        mill_id: string;
        place: string;
        mill_whatsapp_number: string;
        visit_date: Date;
        visit_time: string;
        call_registered_date: Date;
        machine_model: string;
        serial_or_frame_no: string;
        authorized_person: string;
        nature_of_complaint: string;
        action_taken: string;
        engineer_remarks: string;
        engineer_signature: string;
        customer_signature: string;
        mill_email: string | null;
        machine_mfg_date: Date | null;
        machine_installation_date: Date | null;
        previous_visit_engineer: string | null;
        problem_observed: string | null;
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
        machine_filter_condition: string | null;
        auto_drain_valve_working: boolean;
        customer_remarks: string | null;
        report_number: string;
    }>;
    remove(id: string): Promise<{
        mill: {
            name: string;
            id: string;
        };
        serviceCategory: {
            name: string;
            id: string;
        };
        technicians: ({
            technician: {
                full_name: string;
                id: string;
            };
        } & {
            service_report_id: string;
            technician_id: string;
        })[];
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        status: string;
        service_category_id: string;
        mill_id: string;
        place: string;
        mill_whatsapp_number: string;
        visit_date: Date;
        visit_time: string;
        call_registered_date: Date;
        machine_model: string;
        serial_or_frame_no: string;
        authorized_person: string;
        nature_of_complaint: string;
        action_taken: string;
        engineer_remarks: string;
        engineer_signature: string;
        customer_signature: string;
        mill_email: string | null;
        machine_mfg_date: Date | null;
        machine_installation_date: Date | null;
        previous_visit_engineer: string | null;
        problem_observed: string | null;
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
        machine_filter_condition: string | null;
        auto_drain_valve_working: boolean;
        customer_remarks: string | null;
        report_number: string;
    }>;
}
