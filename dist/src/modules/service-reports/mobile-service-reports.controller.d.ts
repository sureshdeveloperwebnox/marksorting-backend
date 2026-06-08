import type { Response } from 'express';
import { ServiceReportsService } from './service-reports.service';
import { CreateMobileServiceReportDto } from './dto/create-mobile-service-report.dto';
import { UpdateMobileServiceReportDto } from './dto/update-mobile-service-report.dto';
export declare class MobileServiceReportsController {
    private readonly serviceReportsService;
    constructor(serviceReportsService: ServiceReportsService);
    findAll(req: any, skip?: string, take?: string, search?: string, status?: string, serviceCategoryId?: string, dateFrom?: string, dateTo?: string): Promise<any>;
    findOne(id: string, req: any): Promise<any>;
    create(dto: CreateMobileServiceReportDto, req: any): Promise<({
        mill: {
            id: string;
            name: string;
            customer: {
                id: string;
                name: string;
            } | null;
        };
        serviceCategory: {
            id: string;
            name: string;
        };
        technicians: ({
            technician: {
                id: string;
                full_name: string;
            };
        } & {
            technician_id: string;
            service_report_id: string;
        })[];
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        status: string;
        mill_id: string;
        place: string;
        visit_date: Date;
        visit_time: string;
        machine_model: string;
        serial_or_frame_no: string;
        service_category_id: string;
        nature_of_complaint: string;
        authorized_person: string;
        customer_signature: string;
        report_number: string;
        mill_whatsapp_number: string;
        mill_email: string | null;
        call_registered_date: Date;
        machine_mfg_date: Date | null;
        machine_installation_date: Date | null;
        previous_visit_engineer: string | null;
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
    }) | null>;
    update(id: string, dto: UpdateMobileServiceReportDto, req: any): Promise<{
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
            serviceCategory: {
                id: string;
                name: string;
            };
            technicians: ({
                technician: {
                    id: string;
                    full_name: string;
                };
            } & {
                technician_id: string;
                service_report_id: string;
            })[];
        } & {
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            status: string;
            mill_id: string;
            place: string;
            visit_date: Date;
            visit_time: string;
            machine_model: string;
            serial_or_frame_no: string;
            service_category_id: string;
            nature_of_complaint: string;
            authorized_person: string;
            customer_signature: string;
            report_number: string;
            mill_whatsapp_number: string;
            mill_email: string | null;
            call_registered_date: Date;
            machine_mfg_date: Date | null;
            machine_installation_date: Date | null;
            previous_visit_engineer: string | null;
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
        serviceCategory: {
            id: string;
            name: string;
        };
        technicians: ({
            technician: {
                id: string;
                full_name: string;
            };
        } & {
            technician_id: string;
            service_report_id: string;
        })[];
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        status: string;
        mill_id: string;
        place: string;
        visit_date: Date;
        visit_time: string;
        machine_model: string;
        serial_or_frame_no: string;
        service_category_id: string;
        nature_of_complaint: string;
        authorized_person: string;
        customer_signature: string;
        report_number: string;
        mill_whatsapp_number: string;
        mill_email: string | null;
        call_registered_date: Date;
        machine_mfg_date: Date | null;
        machine_installation_date: Date | null;
        previous_visit_engineer: string | null;
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
    }>;
    downloadPdf(id: string, req: any, res: Response): Promise<void>;
}
