import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { CreateInstallationReportDto } from './dto/create-installation-report.dto';
import { UpdateInstallationReportDto } from './dto/update-installation-report.dto';
import { CreateMobileInstallationReportDto } from './dto/create-mobile-installation-report.dto';
import { UpdateMobileInstallationReportDto } from './dto/update-mobile-installation-report.dto';
import { SettingsService } from '../settings/settings.service';
import { PdfService } from '../pdf/pdf.service';
import { DocumentTemplateService } from '../pdf/templates/document-template.service';
export declare class InstallationReportsService {
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
    create(dto: CreateInstallationReportDto | CreateMobileInstallationReportDto, user?: {
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
            installation_report_id: string;
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
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
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
        status: string;
        authorized_person_phone: string | null;
        expense_id: string | null;
        invoice_date: Date | null;
        invoice_number: string | null;
        warranty_start_date: Date | null;
        warranty_end_date: Date | null;
        ground_earth_provided: boolean;
        running_channel_combination: number | null;
        running_channel_combination_value: string | null;
        no_of_filters_installed: number | null;
        oil_filter_condition: string | null;
    }) | null>;
    update(id: string, dto: UpdateInstallationReportDto | UpdateMobileInstallationReportDto, user?: {
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
                installation_report_id: string;
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
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
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
            status: string;
            authorized_person_phone: string | null;
            expense_id: string | null;
            invoice_date: Date | null;
            invoice_number: string | null;
            warranty_start_date: Date | null;
            warranty_end_date: Date | null;
            ground_earth_provided: boolean;
            running_channel_combination: number | null;
            running_channel_combination_value: string | null;
            no_of_filters_installed: number | null;
            oil_filter_condition: string | null;
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
            installation_report_id: string;
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
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
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
        status: string;
        authorized_person_phone: string | null;
        expense_id: string | null;
        invoice_date: Date | null;
        invoice_number: string | null;
        warranty_start_date: Date | null;
        warranty_end_date: Date | null;
        ground_earth_provided: boolean;
        running_channel_combination: number | null;
        running_channel_combination_value: string | null;
        no_of_filters_installed: number | null;
        oil_filter_condition: string | null;
    }>;
    private invalidateCache;
    generatePdf(id: string, user?: {
        userId: string;
        role: string;
    }): Promise<{
        buffer: Buffer;
        fileName: string;
    }>;
    private getCompanyPdfSettings;
}
