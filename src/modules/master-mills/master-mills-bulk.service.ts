import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ExcelParserService } from '../../shared/services/excel-parser.service';
import { MasterMillsService } from './master-mills.service';
import { RedisService } from '../../redis/redis.service';
import { QuickRegisterDto } from './dto/quick-register.dto';
import {
  PreviewRow,
  PreviewResponse,
  ImportStatus,
} from './interfaces/bulk-upload.interface';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class MasterMillsBulkService {
  constructor(
    private readonly excelParser: ExcelParserService,
    private readonly masterMillsService: MasterMillsService,
    private readonly redis: RedisService,
  ) {}

  private parseExcelDate(value: string | undefined | null): string | undefined {
    if (!value) return undefined;
    const trimmed = value.trim();
    if (!trimmed) return undefined;

    // Check DD/MM/YYYY format (common in spreadsheet software)
    const ddmmyyyy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = trimmed.match(ddmmyyyy);
    if (match) {
      const [, day, month, year] = match;
      const d = String(day).padStart(2, '0');
      const m = String(month).padStart(2, '0');
      const y = year;
      return `${y}-${m}-${d}`;
    }

    // Fallback to native parsing if it's already ISO or other standard
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
    return undefined;
  }

  /**
   * Generates a .xlsx template buffer for bulk upload.
   */
  async generateTemplate(): Promise<Buffer> {
    return this.excelParser.generateTemplate();
  }

  /**
   * Parses and validates an uploaded Excel file, stores the preview rows in Redis,
   * and returns a PreviewResponse with row counts and an importId for later confirmation.
   */
  async previewUpload(file: MulterFile): Promise<PreviewResponse> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const rows = await this.excelParser.parseAndValidate(file.buffer);

    if (rows.length === 0) {
      throw new BadRequestException('The uploaded file contains no data rows');
    }

    const importId = randomUUID();
    await this.redis.setJson(`bulk_upload:preview:${importId}`, rows, 1800);

    const validRows = rows.filter((r) => r.isValid).length;
    const invalidRows = rows.length - validRows;

    return {
      importId,
      rows,
      totalRows: rows.length,
      validRows,
      invalidRows,
    };
  }

  /**
   * Retrieves a preview session from Redis and kicks off background processing (fire-and-forget).
   */
  async confirmImport(importId: string): Promise<void> {
    const rows = await this.redis.getJson<PreviewRow[]>(
      `bulk_upload:preview:${importId}`,
    );

    if (!rows) {
      throw new NotFoundException(
        'Preview session expired. Please re-upload the file.',
      );
    }

    // Fire-and-forget — intentionally not awaited
    void this.processImport(importId, rows);
  }

  /**
   * Fetches the current import status from Redis for a given importId.
   */
  async getImportStatus(importId: string): Promise<ImportStatus> {
    const status = await this.redis.getJson<ImportStatus>(
      `bulk_upload:status:${importId}`,
    );

    if (!status) {
      throw new NotFoundException(
        'Preview session expired. Please re-upload the file.',
      );
    }

    return status;
  }

  /**
   * Background processing method. Processes valid rows in batches of 50,
   * updating Redis status after each batch. Never rejects — all errors are captured into ImportStatus.
   */
  private async processImport(
    importId: string,
    rows: PreviewRow[],
  ): Promise<void> {
    const statusKey = `bulk_upload:status:${importId}`;

    const status: ImportStatus = {
      state: 'processing',
      percentage: 0,
      processedRows: 0,
      createdCount: 0,
      updatedCount: 0,
      errorCount: 0,
    };

    try {
      const validRows = rows.filter((r) => r.isValid);

      // Write initial status
      await this.redis.setJson(statusKey, status, 7200);

      const batchSize = 50;

      for (let i = 0; i < validRows.length; i += batchSize) {
        const batch = validRows.slice(i, i + batchSize);

        for (const row of batch) {
          try {
            const dto: QuickRegisterDto = {
              customer_name: row.customer_name,
              mill_name: row.mill_name,
              ref_no: row.ref_no,
              frame_no: row.frame_no || undefined,
              mc_model: row.mc_model || undefined,
              address: row.address || undefined,
              place: row.place,
              state: row.state || undefined,
              phone: row.phone_no || undefined,
              type: row.type || undefined,
              invoice_no: row.invoice_no || undefined,
              invoice_date: this.parseExcelDate(row.invoice_date),
              installation_date: this.parseExcelDate(row.installation_date),
              warranty_years: row.warranty_years ? Number(row.warranty_years) : undefined,
              warranty_months: row.warranty_months ? Number(row.warranty_months) : undefined,
              amc_starting_date: this.parseExcelDate(row.amc_starting_date),
              amc_closing_date: this.parseExcelDate(row.amc_closing_date),
              amc_period: row.amc_period ? Number(row.amc_period) : undefined,
              amc_amount: row.amc_amount ? Number(row.amc_amount) : undefined,
              amc_particulars: row.amc_particulars || undefined,
            };

            await this.masterMillsService.quickRegister(dto);
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

      // All batches done — mark as completed
      status.state = 'completed';
      status.percentage = 100;
      await this.redis.setJson(statusKey, status, 7200);
    } catch (error: unknown) {
      status.state = 'failed';
      status.errorMessage =
        error instanceof Error ? error.message : String(error);
      await this.redis.setJson(statusKey, status, 7200).catch(() => {
        // Swallow Redis errors to ensure processImport never rejects
      });
    }
  }
}
