import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { CreateInstallationReportDto } from './dto/create-installation-report.dto';
import { UpdateInstallationReportDto } from './dto/update-installation-report.dto';
import { SettingsService } from '../settings/settings.service';
import { PdfService } from '../pdf/pdf.service';
import { DocumentTemplateService } from '../pdf/templates/document-template.service';
export declare class InstallationReportsService {
    private prisma;
    private redis;
    private settingsService;
    private pdfService;
    private documentTemplateService;
    private readonly CACHE_PREFIX;
    private readonly LIST_CACHE_KEY;
    constructor(prisma: PrismaService, redis: RedisService, settingsService: SettingsService, pdfService: PdfService, documentTemplateService: DocumentTemplateService);
    findAll(params: {
        skip?: number;
        take?: number;
        search?: string;
        status?: string;
        dateFrom?: string;
        dateTo?: string;
    }): Promise<any>;
    findById(id: string): Promise<any>;
    create(dto: CreateInstallationReportDto): Promise<({
        mill: {
            name: string;
            id: string;
        };
        technicians: ({
            technician: {
                full_name: string;
                id: string;
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
        mill_id: string;
        place: string;
        mill_whatsapp_number: string;
        visit_date: Date;
        visit_time: string;
        call_registered_date: Date;
        machine_model: string;
        serial_or_frame_no: string;
        authorized_person: string;
        engineer_remarks: string;
        engineer_signature: string;
        customer_signature: string;
        mill_email: string | null;
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
        customer_remarks: string | null;
        report_number: string;
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
    update(id: string, dto: UpdateInstallationReportDto): Promise<{
        mill: {
            name: string;
            id: string;
        };
        technicians: ({
            technician: {
                full_name: string;
                id: string;
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
        mill_id: string;
        place: string;
        mill_whatsapp_number: string;
        visit_date: Date;
        visit_time: string;
        call_registered_date: Date;
        machine_model: string;
        serial_or_frame_no: string;
        authorized_person: string;
        engineer_remarks: string;
        engineer_signature: string;
        customer_signature: string;
        mill_email: string | null;
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
        customer_remarks: string | null;
        report_number: string;
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
    remove(id: string): Promise<{
        mill: {
            name: string;
            id: string;
        };
        technicians: ({
            technician: {
                full_name: string;
                id: string;
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
        mill_id: string;
        place: string;
        mill_whatsapp_number: string;
        visit_date: Date;
        visit_time: string;
        call_registered_date: Date;
        machine_model: string;
        serial_or_frame_no: string;
        authorized_person: string;
        engineer_remarks: string;
        engineer_signature: string;
        customer_signature: string;
        mill_email: string | null;
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
        customer_remarks: string | null;
        report_number: string;
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
    private invalidateCache;
    generatePdf(id: string): Promise<{
        buffer: Buffer;
        fileName: string;
    }>;
    private getCompanyPdfSettings;
}
