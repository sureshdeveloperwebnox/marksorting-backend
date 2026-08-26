import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ExcelParserService } from '../../shared/services/excel-parser.service';
import { MasterMillsService } from './master-mills.service';
import { RedisService } from '../../redis/redis.service';
import { PrismaService } from '../../prisma/prisma.service';
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
    private readonly prisma: PrismaService,
  ) {}

  private parseExcelDate(value: string | undefined | null): string | undefined {
    if (!value) return undefined;
    const trimmed = value.trim();
    if (!trimmed) return undefined;

    // Filter out known empty tokens
    if (
      [
        '00-01-1900',
        '00/00/0000',
        '00:00:00',
        '0/0/00',
        '01-01-1970',
        '01/01/1970',
        '#num!',
        '#value!',
        '#ref!',
        '#n/a',
        'n/a',
        'na',
        'null',
        'undefined',
        '-',
        '.',
      ].includes(trimmed.toLowerCase())
    ) {
      return undefined;
    }

    // Check DD/MM/YYYY or DD-MM-YYYY format
    const ddmmyyyy = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;
    const match = trimmed.match(ddmmyyyy);
    if (match) {
      const [, day, month, year] = match;
      const d = String(day).padStart(2, '0');
      const m = String(month).padStart(2, '0');
      const y = year;
      if (Number(m) >= 1 && Number(m) <= 12 && Number(d) >= 1 && Number(d) <= 31 && Number(y) >= 1950) {
        return `${y}-${m}-${d}`;
      }
    }

    // Check YYYY-MM-DD format
    const yyyymmdd = /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/;
    const matchIso = trimmed.match(yyyymmdd);
    if (matchIso) {
      const [, year, month, day] = matchIso;
      const d = String(day).padStart(2, '0');
      const m = String(month).padStart(2, '0');
      const y = year;
      if (Number(m) >= 1 && Number(m) <= 12 && Number(d) >= 1 && Number(d) <= 31 && Number(y) >= 1950) {
        return `${y}-${m}-${d}`;
      }
    }

    // Fallback to native parsing if it's already ISO or other standard
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime()) && parsed.getFullYear() >= 1950) {
      return parsed.toISOString().split('T')[0];
    }
    return undefined;
  }

  private formatPhoneNumber(phone: string | undefined): string | undefined {
    if (!phone) return undefined;
    let cleaned = phone.trim().replace(/[-\s()]/g, '');
    if (cleaned === '' || cleaned === '-' || cleaned === '.' || cleaned.toLowerCase() === 'null') return undefined;

    if (cleaned.startsWith('+')) {
      return cleaned;
    }

    if (cleaned.startsWith('0') && cleaned.length === 11) {
      cleaned = cleaned.substring(1);
    }

    if (cleaned.length === 10 && /^\d+$/.test(cleaned)) {
      return `+91${cleaned}`;
    }

    if (cleaned.length === 12 && cleaned.startsWith('91') && /^\d+$/.test(cleaned)) {
      return `+${cleaned}`;
    }

    if (/^\d{7,15}$/.test(cleaned)) {
      return `+91${cleaned}`;
    }

    return cleaned;
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

    // Retrieve all active master mills from database to check for duplicates
    const dbMasterMills = await this.prisma.masterMill.findMany({
      where: { deleted_at: null },
      select: {
        ref_no: true,
        frame_no: true,
        mill: {
          select: {
            name: true,
            customer: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Track duplicate (Ref No, Frame No) pairs within the Excel sheet itself (intra-sheet check)
    const sheetPairKeys = new Set<string>();

    for (const row of rows) {
      row.phone_no = this.formatPhoneNumber(row.phone_no) || '';
      const cleanRef = row.ref_no?.trim().toLowerCase();
      const cleanFrame = row.frame_no?.trim().toLowerCase() || '';
      const cleanMillName = row.mill_name?.trim().toLowerCase();
      const cleanCustomerName = row.customer_name?.trim().toLowerCase();

      // 0. Ensure Ref No is present
      if (!cleanRef) {
        row.errors.ref_no = 'Ref No is required';
        row.isValid = false;
      }

      // 1. Check for duplicate (Ref No, Frame No) pair in the spreadsheet itself
      if (cleanRef) {
        const pairKey = `${cleanRef}::${cleanFrame}`;
        if (sheetPairKeys.has(pairKey)) {
          row.errors.ref_no = `Duplicate Ref No & Frame No combination in Excel sheet`;
          if (cleanFrame) {
            row.errors.frame_no = `Duplicate Ref No & Frame No combination in Excel sheet`;
          }
        }
      }

      // 2. Check for duplicate (Ref No, Frame No) pair in the database under a different mill/customer
      if (cleanRef && !row.errors.ref_no) {
        const matchingMM = dbMasterMills.find(
          (m) =>
            m.ref_no?.trim().toLowerCase() === cleanRef &&
            (m.frame_no?.trim().toLowerCase() || '') === cleanFrame,
        );
        if (matchingMM) {
          const isSameMill =
            matchingMM.mill?.name?.trim().toLowerCase() === cleanMillName &&
            (!cleanCustomerName || matchingMM.mill?.customer?.name?.trim().toLowerCase() === cleanCustomerName);
          if (!isSameMill) {
            row.errors.ref_no = 'Ref No & Frame No already exists under a different customer or mill';
            if (cleanFrame) {
              row.errors.frame_no = 'Ref No & Frame No already exists under a different customer or mill';
            }
          }
        }
      }

      // 3. Mark invalid if new errors were found
      if (row.errors.ref_no || row.errors.frame_no) {
        row.isValid = false;
      }

      // 4. If unique pair in sheet so far, add to sheet tracking
      if (cleanRef && !row.errors.ref_no) {
        const pairKey = `${cleanRef}::${cleanFrame}`;
        sheetPairKeys.add(pairKey);
      }
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
   * Background processing method. Processes valid rows in high-throughput chunks,
   * updating Redis status smoothly after each batch. Never rejects — all errors are captured into ImportStatus.
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

      const batchSize = 25; // 25 rows per concurrent chunk

      for (let i = 0; i < validRows.length; i += batchSize) {
        const batch = validRows.slice(i, i + batchSize);

        const results = await Promise.all(
          batch.map(async (row) => {
            try {
              const dto: QuickRegisterDto = {
                customer_name: row.customer_name || undefined,
                mill_name: row.mill_name,
                ref_no: row.ref_no,
                frame_no: row.frame_no || undefined,
                mc_model: row.mc_model || undefined,
                address: row.address || undefined,
                place: row.place || 'Unknown',
                state: row.state || undefined,
                phone: row.phone_no || undefined,
                mfg_date: this.parseExcelDate(row.mfg_date),
                invoice_no: row.invoice_no || undefined,
                invoice_date: this.parseExcelDate(row.invoice_date),
                installation_date: this.parseExcelDate(row.installation_date),
                warranty_start_date: this.parseExcelDate(row.warranty_start_date),
                warranty_years: row.warranty_years ? Number(row.warranty_years) : undefined,
                warranty_months: row.warranty_months ? Number(row.warranty_months) : undefined,
                amc_starting_date: this.parseExcelDate(row.amc_starting_date),
                amc_closing_date: row.amc_starting_date ? this.parseExcelDate(row.amc_closing_date) : undefined,
                amc_period: row.amc_period ? Number(row.amc_period) : undefined,
                amc_amount: row.amc_amount ? Number(row.amc_amount) : undefined,
                amc_particulars: row.amc_particulars || undefined,
              };

              const res = await this.masterMillsService.quickRegister(dto, {
                skipDuplicateCheck: false,
                skipCacheInvalidation: true,
              });
              return { success: true, isUpdate: res?._isUpdate };
            } catch (err: any) {
              console.error('Master mill row import error:', err?.message || err);
              return { success: false, error: err };
            }
          }),
        );

        for (const res of results) {
          if (res.success) {
            if (res.isUpdate) {
              status.updatedCount++;
            } else {
              status.createdCount++;
            }
          } else {
            status.errorCount++;
          }
        }

        status.processedRows += batch.length;
        status.percentage = Math.round(
          (status.processedRows / validRows.length) * 100,
        );

        await this.redis.setJson(statusKey, status, 7200);
      }

      // Invalidate caches once for the entire import
      await Promise.all([
        this.redis.delByPrefix('customers:list:'),
        this.redis.delByPrefix('mills:list:'),
        this.redis.delByPrefix('master_mills:list:'),
      ]).catch(() => {});

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

