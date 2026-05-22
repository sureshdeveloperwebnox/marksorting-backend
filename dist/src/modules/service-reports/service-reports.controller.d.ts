import { ServiceReportsService } from './service-reports.service';
import { CreateServiceReportDto } from './dto/create-service-report.dto';
import { UpdateServiceReportDto } from './dto/update-service-report.dto';
export declare class ServiceReportsController {
    private readonly serviceReportsService;
    constructor(serviceReportsService: ServiceReportsService);
    findAll(skip?: string, take?: string, search?: string, status?: string, serviceCategoryId?: string, dateFrom?: string, dateTo?: string): Promise<any>;
    findOne(id: string): Promise<any>;
    create(dto: CreateServiceReportDto): Promise<({
        serviceCategory: {
            id: string;
            name: string;
        };
        mill: {
            id: string;
            name: string;
        };
        technicians: ({
            technician: {
                id: string;
                full_name: string;
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
        report_number: string;
        service_category_id: string;
        mill_id: string;
        place: string;
        mill_whatsapp_number: string;
        mill_email: string | null;
        visit_date: Date;
        visit_time: string;
        call_registered_date: Date;
        machine_model: string;
        machine_mfg_date: Date | null;
        machine_installation_date: Date | null;
        serial_or_frame_no: string;
        authorized_person: string;
        previous_visit_engineer: string | null;
        nature_of_complaint: string;
        problem_observed: string | null;
        action_taken: string;
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
        engineer_remarks: string;
        engineer_signature: string;
        customer_remarks: string | null;
        customer_signature: string;
    }) | null>;
    update(id: string, dto: UpdateServiceReportDto): Promise<{
        serviceCategory: {
            id: string;
            name: string;
        };
        mill: {
            id: string;
            name: string;
        };
        technicians: ({
            technician: {
                id: string;
                full_name: string;
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
        report_number: string;
        service_category_id: string;
        mill_id: string;
        place: string;
        mill_whatsapp_number: string;
        mill_email: string | null;
        visit_date: Date;
        visit_time: string;
        call_registered_date: Date;
        machine_model: string;
        machine_mfg_date: Date | null;
        machine_installation_date: Date | null;
        serial_or_frame_no: string;
        authorized_person: string;
        previous_visit_engineer: string | null;
        nature_of_complaint: string;
        problem_observed: string | null;
        action_taken: string;
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
        engineer_remarks: string;
        engineer_signature: string;
        customer_remarks: string | null;
        customer_signature: string;
    }>;
    remove(id: string): Promise<{
        serviceCategory: {
            id: string;
            name: string;
        };
        mill: {
            id: string;
            name: string;
        };
        technicians: ({
            technician: {
                id: string;
                full_name: string;
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
        report_number: string;
        service_category_id: string;
        mill_id: string;
        place: string;
        mill_whatsapp_number: string;
        mill_email: string | null;
        visit_date: Date;
        visit_time: string;
        call_registered_date: Date;
        machine_model: string;
        machine_mfg_date: Date | null;
        machine_installation_date: Date | null;
        serial_or_frame_no: string;
        authorized_person: string;
        previous_visit_engineer: string | null;
        nature_of_complaint: string;
        problem_observed: string | null;
        action_taken: string;
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
        engineer_remarks: string;
        engineer_signature: string;
        customer_remarks: string | null;
        customer_signature: string;
    }>;
}
