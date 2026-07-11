import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { InstallationReportsExcelParserService } from './installation-reports-excel-parser.service';
import {
  InstallationReportPreviewRow,
  InstallationReportPreviewResponse,
  InstallationReportImportStatus,
} from './interfaces/bulk-upload.interface';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

const VALID_CHANNEL_VALUES = [
  'PRIMARY',
  'SECONDARY',
  'REJECTION_1',
  'REJECTION_2',
  'SPLIT',
] as const;
type ChannelValue = (typeof VALID_CHANNEL_VALUES)[number];

@Injectable()
export class InstallationReportsBulkService {
  constructor(
    private readonly excelParser: InstallationReportsExcelParserService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async generateTemplate(): Promise<Buffer> {
    return this.excelParser.generateTemplate();
  }

  async previewUpload(
    file: MulterFile,
  ): Promise<InstallationReportPreviewResponse> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    let rows: InstallationReportPreviewRow[];
    try {
      rows = await this.excelParser.parseAndValidate(file.buffer);
    } catch {
      throw new BadRequestException(
        'Unable to parse the uploaded file. Ensure it is a valid .xlsx or .xls file.',
      );
    }

    if (rows.length === 0) {
      throw new BadRequestException('The uploaded file contains no data rows');
    }

    const importId = randomUUID();
    await this.redis.setJson(`ir_bulk_upload:preview:${importId}`, rows, 1800);

    const validRows = rows.filter((r) => r.isValid).length;
    return {
      importId,
      rows,
      totalRows: rows.length,
      validRows,
      invalidRows: rows.length - validRows,
    };
  }

  async confirmImport(importId: string): Promise<void> {
    const rows = await this.redis.getJson<InstallationReportPreviewRow[]>(
      `ir_bulk_upload:preview:${importId}`,
    );

    if (!rows) {
      throw new NotFoundException(
        'Preview session expired. Please re-upload the file.',
      );
    }

    void this.processImport(importId, rows);
  }

  async getImportStatus(
    importId: string,
  ): Promise<InstallationReportImportStatus> {
    const status = await this.redis.getJson<InstallationReportImportStatus>(
      `ir_bulk_upload:status:${importId}`,
    );

    if (!status) {
      throw new NotFoundException(
        'Import status not found. The session may have expired.',
      );
    }

    return status;
  }

  private async processImport(
    importId: string,
    rows: InstallationReportPreviewRow[],
  ): Promise<void> {
    const statusKey = `ir_bulk_upload:status:${importId}`;

    const status: InstallationReportImportStatus = {
      state: 'processing',
      percentage: 0,
      processedRows: 0,
      createdCount: 0,
      errorCount: 0,
    };

    try {
      const validRows = rows.filter((r) => r.isValid);
      await this.redis.setJson(statusKey, status, 7200);

      const batchSize = 50;

      for (let i = 0; i < validRows.length; i += batchSize) {
        const batch = validRows.slice(i, i + batchSize);

        for (const row of batch) {
          try {
            await this.importSingleRow(row);
            status.createdCount++;
          } catch {
            status.errorCount++;
          }
        }

        status.processedRows += batch.length;
        status.percentage = Math.round(
          (status.processedRows / validRows.length) * 100,
        );
        await this.redis.setJson(statusKey, status, 7200);
      }

      status.state = 'completed';
      status.percentage = 100;
      await this.redis.setJson(statusKey, status, 7200);
    } catch (error: unknown) {
      status.state = 'failed';
      status.errorMessage =
        error instanceof Error ? error.message : String(error);
      await this.redis.setJson(statusKey, status, 7200).catch(() => {});
    }
  }

  private async importSingleRow(
    row: InstallationReportPreviewRow,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // ── Resolve Mill ─────────────────────────────────────────────────────
      const mill = await tx.mill.findFirst({
        where: {
          name: { equals: row.mill_name.trim(), mode: 'insensitive' },
          deleted_at: null,
        },
        select: { id: true, phone: true, email: true },
      });
      if (!mill) throw new Error(`Mill "${row.mill_name}" not found`);

      // ── Resolve Technicians ──────────────────────────────────────────────
      const rawNames = row.technician_names
        .split(',')
        .map((n) => n.trim())
        .filter(Boolean);

      const technicianIds: string[] = [];
      for (const name of rawNames) {
        const tech = await tx.technician.findFirst({
          where: {
            full_name: { equals: name, mode: 'insensitive' },
            deleted_at: null,
          },
          select: { id: true },
        });
        if (tech) technicianIds.push(tech.id);
      }

      if (technicianIds.length === 0) {
        throw new Error(
          `No matching technicians found for: "${row.technician_names}"`,
        );
      }

      // ── Generate report number ───────────────────────────────────────────
      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setUTCHours(23, 59, 59, 999);

      const count = await tx.installationReport.count({
        where: { created_at: { gte: todayStart, lte: todayEnd } },
      });

      const dateStr = todayStart.toISOString().slice(0, 10).replace(/-/g, '');
      const report_number = `IR-${dateStr}-${count + 1}`;

      // ── Parse helpers ────────────────────────────────────────────────────
      const parseDate = (val: string): Date | undefined => {
        const trimmed = val.trim();
        if (!trimmed) return undefined;
        const ddmmyyyy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
        if (ddmmyyyy) {
          const [, d, m, y] = ddmmyyyy;
          return new Date(Number(y), Number(m) - 1, Number(d));
        }
        const date = new Date(trimmed);
        return isNaN(date.getTime()) ? undefined : date;
      };

      const parseYesNo = (val: string): boolean =>
        val.trim().toLowerCase() === 'yes';

      const parseOptionalInt = (val: string): number | undefined => {
        const trimmed = val.trim();
        if (!trimmed) return undefined;
        const n = parseInt(trimmed, 10);
        return isNaN(n) ? undefined : n;
      };

      // Validate channel combination value
      const channelValRaw = row.running_channel_combination_value
        .trim()
        .toUpperCase();
      const channelVal = VALID_CHANNEL_VALUES.includes(
        channelValRaw as ChannelValue,
      )
        ? (channelValRaw as ChannelValue)
        : undefined;

      // ── Create the InstallationReport ────────────────────────────────────
      const created = await tx.installationReport.create({
        data: {
          report_number,
          mill_id: mill.id,
          place: row.place.trim(),
          mill_whatsapp_number:
            row.mill_whatsapp_number.trim() || mill.phone || '',
          mill_email: row.mill_email.trim() || mill.email || undefined,
          visit_date: parseDate(row.visit_date) ?? new Date(),
          visit_time: row.visit_time.trim() || '00:00',
          call_registered_date:
            parseDate(row.call_registered_date) ?? new Date(),
          machine_model: row.machine_model.trim(),
          machine_mfg_date: parseDate(row.machine_mfg_date) ?? new Date(),
          serial_or_frame_no: row.serial_or_frame_no.trim(),
          authorized_person: row.authorized_person.trim(),
          authorized_person_phone:
            row.authorized_person_phone.trim() || undefined,
          invoice_number: row.invoice_number.trim() || undefined,
          invoice_date: parseDate(row.invoice_date),
          warranty_start_date: parseDate(row.warranty_start_date),
          warranty_end_date: parseDate(row.warranty_end_date),
          commodity: row.commodity.trim() || undefined,
          contamination: row.contamination.trim() || undefined,
          output_capacity_per_hour:
            row.output_capacity_per_hour.trim() || undefined,
          rejection_ratio: row.rejection_ratio.trim() || undefined,
          purity: row.purity.trim() || undefined,
          no_of_programs_set: parseOptionalInt(row.no_of_programs_set),
          ac_provided: parseYesNo(row.ac_provided),
          compressor_details: row.compressor_details.trim() || undefined,
          air_drier_details: row.air_drier_details.trim() || undefined,
          ground_earth_provided: parseYesNo(row.ground_earth_provided),
          running_channel_combination: parseOptionalInt(
            row.running_channel_combination,
          ),
          running_channel_combination_value: channelVal,
          no_of_filters_installed: parseOptionalInt(
            row.no_of_filters_installed,
          ),
          oil_filter_condition: row.oil_filter_condition.trim() || undefined,
          line_filter_condition: row.line_filter_condition.trim() || undefined,
          auto_drain_valve_working: parseYesNo(row.auto_drain_valve_working),
          engineer_remarks: row.engineer_remarks.trim(),
          customer_remarks: row.customer_remarks.trim() || undefined,
          // Signatures not collected via Excel
          engineer_signature: 'bulk-import',
          customer_signature: 'bulk-import',
          status: row.status || 'PENDING',
        },
      });

      // ── Connect technicians ──────────────────────────────────────────────
      await tx.installationReportTechnician.createMany({
        data: technicianIds.map((tid) => ({
          installation_report_id: created.id,
          technician_id: tid,
        })),
      });
    });
  }
}
