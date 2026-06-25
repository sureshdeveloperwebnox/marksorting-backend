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
        customerId?: string;
        millId?: string;
        dateFrom?: string;
        dateTo?: string;
        expenseEligibleOnly?: boolean;
        excludeExpenseId?: string;
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
            technician_id: string;
            service_report_id: string;
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
        authorized_person_phone: string | null;
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
        status: string;
        id: string;
        report_number: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
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
                technician_id: string;
                service_report_id: string;
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
            authorized_person_phone: string | null;
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
            status: string;
            id: string;
            report_number: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
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
            technician_id: string;
            service_report_id: string;
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
        authorized_person_phone: string | null;
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
        status: string;
        id: string;
        report_number: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
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
