import { Prisma } from '@prisma/client';
import { RedisService } from '../../redis/redis.service';
export interface InstallationReportSyncInput {
    mill_id: string;
    visit_date: Date;
    machine_model: string;
    serial_or_frame_no: string;
    place: string;
    mill_whatsapp_number: string;
    invoice_number?: string | null;
    invoice_date?: Date | null;
    warranty_start_date?: Date | null;
    warranty_end_date?: Date | null;
}
export interface ServiceReportSyncInput {
    mill_id: string;
    visit_date: Date;
    machine_model: string;
    serial_or_frame_no: string;
    place: string;
    mill_whatsapp_number: string;
    machine_installation_date?: Date | null;
}
export declare function syncInstallationToMasterMill(tx: Prisma.TransactionClient, report: InstallationReportSyncInput, redis: RedisService): Promise<void>;
export declare function syncServiceToMasterMill(tx: Prisma.TransactionClient, report: ServiceReportSyncInput, redis: RedisService): Promise<void>;
