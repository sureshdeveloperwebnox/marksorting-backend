import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { CreateServiceReportDto } from './dto/create-service-report.dto';
import { UpdateServiceReportDto } from './dto/update-service-report.dto';
import { CreateMobileServiceReportDto } from './dto/create-mobile-service-report.dto';
import { UpdateMobileServiceReportDto } from './dto/update-mobile-service-report.dto';
import { SettingsService } from '../settings/settings.service';
import { PdfService } from '../pdf/pdf.service';
import { DocumentTemplateService } from '../pdf/templates/document-template.service';
export declare class ServiceReportsService {
    private prisma;
    private redis;
    private settingsService;
    private pdfService;
    private documentTemplateService;
    private eventEmitter;
    private readonly CACHE_PREFIX;
    private readonly LIST_CACHE_KEY;
    constructor(prisma: PrismaService, redis: RedisService, settingsService: SettingsService, pdfService: PdfService, documentTemplateService: DocumentTemplateService, eventEmitter: EventEmitter2);
    findAll(params: {
        skip?: number;
        take?: number;
        search?: string;
        status?: string;
        serviceCategoryId?: string;
        technicianId?: string;
        dateFrom?: string;
        dateTo?: string;
    }, user?: {
        userId: string;
        role: string;
    }): Promise<any>;
    findById(id: string, user?: {
        userId: string;
        role: string;
    }): Promise<any>;
    create(dto: CreateServiceReportDto | CreateMobileServiceReportDto, user?: {
        userId: string;
        role: string;
    }): Promise<({
        technicians: ({
            technician: {
                id: string;
                full_name: string;
            };
        } & {
            service_report_id: string;
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
        serviceCategory: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
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
        status: string;
        authorized_person_phone: string | null;
        expense_id: string | null;
    }) | null>;
    update(id: string, dto: UpdateServiceReportDto | UpdateMobileServiceReportDto, user?: {
        userId: string;
        role: string;
    }): Promise<{
        before: any;
        after: {
            technicians: ({
                technician: {
                    id: string;
                    full_name: string;
                };
            } & {
                service_report_id: string;
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
            serviceCategory: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
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
            status: string;
            authorized_person_phone: string | null;
            expense_id: string | null;
        };
    }>;
    remove(id: string, user?: {
        userId: string;
        role: string;
    }): Promise<{
        technicians: ({
            technician: {
                id: string;
                full_name: string;
            };
        } & {
            service_report_id: string;
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
        serviceCategory: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
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
        status: string;
        authorized_person_phone: string | null;
        expense_id: string | null;
    }>;
    generatePdf(id: string, user?: {
        userId: string;
        role: string;
    }): Promise<{
        buffer: Buffer;
        fileName: string;
    }>;
    private getCompanyPdfSettings;
    private invalidateCache;
}
