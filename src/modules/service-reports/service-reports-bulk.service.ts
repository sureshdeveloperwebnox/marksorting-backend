import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { ServiceReportsExcelParserService } from './service-reports-excel-parser.service';
import {
  ServiceReportPreviewRow,
  ServiceReportPreviewResponse,
  ServiceReportImportStatus,
} from './interfaces/bulk-upload.interface';
import { MasterMillsService } from '../master-mills/master-mills.service';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class ServiceReportsBulkService {
  constructor(
    private readonly excelParser: ServiceReportsExcelParserService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly masterMillsService: MasterMillsService,
  ) {}

  // ─── Template ─────────────────────────────────────────────────────────────────

  async generateTemplate(): Promise<Buffer> {
    return this.excelParser.generateTemplate();
  }

  // ─── Preview Upload ───────────────────────────────────────────────────────────

  async previewUpload(file: MulterFile): Promise<ServiceReportPreviewResponse> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    let rows: ServiceReportPreviewRow[];
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
    await this.redis.setJson(`sr_bulk_upload:preview:${importId}`, rows, 1800);

    const validRows = rows.filter((r) => r.isValid).length;
    const invalidRows = rows.length - validRows;

    return { importId, rows, totalRows: rows.length, validRows, invalidRows };
  }

  // ─── Confirm Import ───────────────────────────────────────────────────────────

  async confirmImport(importId: string): Promise<void> {
    const rows = await this.redis.getJson<ServiceReportPreviewRow[]>(
      `sr_bulk_upload:preview:${importId}`,
    );

    if (!rows) {
      throw new NotFoundException(
        'Preview session expired. Please re-upload the file.',
      );
    }

    // Fire-and-forget — intentionally not awaited
    void this.processImport(importId, rows);
  }

  // ─── Status ───────────────────────────────────────────────────────────────────

  async getImportStatus(importId: string): Promise<ServiceReportImportStatus> {
    const status = await this.redis.getJson<ServiceReportImportStatus>(
      `sr_bulk_upload:status:${importId}`,
    );

    if (!status) {
      throw new NotFoundException(
        'Import status not found. The session may have expired.',
      );
    }

    return status;
  }

  // ─── Background processing (fire-and-forget) ──────────────────────────────────

  private async processImport(
    importId: string,
    rows: ServiceReportPreviewRow[],
  ): Promise<void> {
    const statusKey = `sr_bulk_upload:status:${importId}`;

    const status: ServiceReportImportStatus = {
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
      await this.redis.setJson(statusKey, status, 7200).catch(() => {
        // Swallow Redis errors — processImport must never reject
      });
    }
  }

  /**
   * Imports a single validated preview row into the database.
   *
   * Resolution strategy:
   *  - ServiceCategory: match by name (case-insensitive), throw if not found
   *  - Mill:            match by name (case-insensitive), throw if not found
   *  - Technicians:     split comma-separated names, resolve each by full_name
   *                     (case-insensitive), skip unresolvable names gracefully
   */
  private async importSingleRow(row: ServiceReportPreviewRow): Promise<void> {
    // Capture millId outside the transaction so it is accessible afterwards
    let resolvedMillId: string | null = null;

    await this.prisma.$transaction(async (tx) => {
      // ── Resolve ServiceCategory ──────────────────────────────────────────
      const category = await tx.serviceCategory.findFirst({
        where: {
          name: {
            equals: row.service_category_name.trim(),
            mode: 'insensitive',
          },
          deleted_at: null,
        },
        select: { id: true },
      });
      if (!category) {
        throw new Error(
          `Service category "${row.service_category_name}" not found`,
        );
      }

      // ── Resolve Mill ─────────────────────────────────────────────────────
      const mill = await tx.mill.findFirst({
        where: {
          name: { equals: row.mill_name.trim(), mode: 'insensitive' },
          deleted_at: null,
        },
        select: { id: true, phone: true, email: true },
      });
      if (!mill) {
        throw new Error(`Mill "${row.mill_name}" not found`);
      }

      // Expose mill id to the outer scope for the post-transaction sync
      resolvedMillId = mill.id;

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

      // At least one technician must be resolved
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

      const count = await tx.serviceReport.count({
        where: { created_at: { gte: todayStart, lte: todayEnd } },
      });

      const dateStr = todayStart.toISOString().slice(0, 10).replace(/-/g, '');
      const report_number = `SR-${dateStr}-${count + 1}`;

      // ── Parse dates ──────────────────────────────────────────────────────
      const parseDate = (val: string): Date | undefined => {
        const trimmed = val.trim();
        if (!trimmed) return undefined;
        const ddmmyyyy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
        if (ddmmyyyy) {
          const [, d, m, y] = ddmmyyyy;
          return new Date(Number(y), Number(m) - 1, Number(d));
        }
        const d = new Date(trimmed);
        return isNaN(d.getTime()) ? undefined : d;
      };

      // ── Create the ServiceReport ─────────────────────────────────────────
      const created = await tx.serviceReport.create({
        data: {
          report_number,
          service_category_id: category.id,
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
          machine_installation_date: parseDate(row.machine_installation_date),
          serial_or_frame_no: row.serial_or_frame_no.trim(),
          authorized_person: row.authorized_person.trim(),
          authorized_person_phone:
            row.authorized_person_phone.trim() || undefined,
          previous_visit_engineer:
            row.previous_visit_engineer.trim() || undefined,
          nature_of_complaint: row.nature_of_complaint.trim(),
          problem_observed: row.problem_observed.trim() || undefined,
          action_taken: row.action_taken.trim(),
          commodity: row.commodity.trim() || undefined,
          contamination: row.contamination.trim() || undefined,
          output_capacity_per_hour:
            row.output_capacity_per_hour.trim() || undefined,
          rejection_ratio: row.rejection_ratio.trim() || undefined,
          purity: row.purity.trim() || undefined,
          no_of_programs_set: row.no_of_programs_set.trim()
            ? parseInt(row.no_of_programs_set.trim(), 10)
            : undefined,
          ac_provided: row.ac_provided.trim().toLowerCase() === 'yes',
          compressor_details: row.compressor_details.trim() || undefined,
          air_drier_details: row.air_drier_details.trim() || undefined,
          line_filter_condition: row.line_filter_condition.trim() || undefined,
          machine_filter_condition:
            row.machine_filter_condition.trim() || undefined,
          auto_drain_valve_working:
            row.auto_drain_valve_working.trim().toLowerCase() === 'yes',
          engineer_remarks: row.engineer_remarks.trim(),
          customer_remarks: row.customer_remarks.trim() || undefined,
          // Signatures are not collected via Excel; placeholders are set
          engineer_signature: 'bulk-import',
          customer_signature: 'bulk-import',
          status: row.status || 'PENDING',
        },
      });

      // ── Connect technicians ──────────────────────────────────────────────
      await tx.serviceReportTechnician.createMany({
        data: technicianIds.map((tid) => ({
          service_report_id: created.id,
          technician_id: tid,
        })),
      });
    });

    // Sync master-mills registry (fire-and-forget) — runs after transaction commits
    if (resolvedMillId) {
      void this.masterMillsService.syncFromServiceReport({
        millId: resolvedMillId,
        frameNo: row.serial_or_frame_no.trim() || undefined,
        mcModel: row.machine_model.trim() || undefined,
        installationDate: (() => {
          const d = row.machine_installation_date?.trim();
          if (!d) return null;
          const ddmmyyyy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(d);
          if (ddmmyyyy) {
            const [, day, month, year] = ddmmyyyy;
            return new Date(Number(year), Number(month) - 1, Number(day));
          }
          const parsed = new Date(d);
          return isNaN(parsed.getTime()) ? null : parsed;
        })(),
        place: row.place.trim() || undefined,
      });
    }
  }
}
