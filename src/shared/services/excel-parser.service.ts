import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { PreviewRow } from '../../modules/master-mills/interfaces/bulk-upload.interface';

// Column order for template (19 headers)
const TEMPLATE_HEADERS = [
  'Invoice No',
  'Record Type',
  'Invoice Date',
  'Ref No',
  'Frame No',
  'MC Model',
  'Mill Name',
  'Customer Name',
  'Place',
  'State',
  'Phone No',
  'Address',
  'Installation Date',
  'Warranty Start Date',
  'Warranty Years',
  'Warranty Months',
  'AMC Starting Date',
  'AMC Closing Date',
  'AMC Period (Months)',
  'AMC Amount',
  'AMC Particulars',
];

// Example data row for the template
const EXAMPLE_ROW = [
  'INV-001',
  'Installation',
  '01/01/2024',
  'REF-001',
  'FRM-001',
  'Model XYZ',
  'ABC Mills',
  'John Doe',
  'Chennai',
  'Tamil Nadu',
  '9876543210',
  '123, Main Street, Chennai - 600001',
  '15/01/2024',
  '15/01/2024',
  '2',
  '6',
  '01/02/2024',
  '01/02/2025',
  '12',
  '5000',
  'Annual Maintenance Contract',
];

// Mapping: normalized header → PreviewRow field key
const HEADER_TO_FIELD_MAP: Record<
  string,
  keyof Omit<PreviewRow, 'errors' | 'isValid' | 'rowIndex'>
> = {
  'invoice no': 'invoice_no',
  'record type': 'type',
  'invoice date': 'invoice_date',
  'ref no': 'ref_no',
  'frame no': 'frame_no',
  'mfg date': 'mfg_date',
  'manufacturing date': 'mfg_date',
  'mc model': 'mc_model',
  'mill name': 'mill_name',
  'customer name': 'customer_name',
  place: 'place',
  state: 'state',
  'phone no': 'phone_no',
  address: 'address',
  'installation date': 'installation_date',
  'warranty start date': 'warranty_start_date',
  'warranty years': 'warranty_years',
  'warranty months': 'warranty_months',
  'amc starting date': 'amc_starting_date',
  'amc closing date': 'amc_closing_date',
  'amc period (months)': 'amc_period',
  'amc amount': 'amc_amount',
  'amc particulars': 'amc_particulars',
};

// Required fields — must be present and non-empty
const REQUIRED_FIELDS: Array<keyof PreviewRow> = [
  'invoice_no',
  'mill_name',
  'customer_name',
  'place',
];

// Date fields — must be parseable when present
const DATE_FIELDS: Array<keyof PreviewRow> = [
  'invoice_date',
  'installation_date',
  'warranty_start_date',
  'mfg_date',
  'amc_starting_date',
  'amc_closing_date',
];

// Numeric fields — must be numeric when present
const NUMERIC_FIELDS: Array<keyof PreviewRow> = [
  'warranty_years',
  'warranty_months',
  'amc_period',
  'amc_amount',
];

@Injectable()
export class ExcelParserService {
  /**
   * Generates a .xlsx buffer with 18 header columns + 1 example data row.
   * Returns Promise<Buffer> because exceljs writeBuffer is async.
   */
  async generateTemplate(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Template');

    // Set column definitions with headers
    worksheet.columns = TEMPLATE_HEADERS.map((header) => ({
      header,
      key: header,
      width: Math.max(header.length + 4, 15),
    }));

    // Style the header row (bold, background color)
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' },
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // Add example data row
    worksheet.addRow(EXAMPLE_ROW);

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Parses an Excel buffer, normalizes headers, validates each row.
   * Returns a PreviewRow per data row; never throws on row-level errors.
   */
  async parseAndValidate(buffer: Buffer): Promise<PreviewRow[]> {
    const workbook = new ExcelJS.Workbook();
    // Cast needed for exceljs compatibility with TypeScript 5.9 typed Buffer

    await workbook.xlsx.load(buffer as any);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return [];
    }

    // Read header row (row 1) — normalize headers and build colNumber → fieldKey map
    const headerRow = worksheet.getRow(1);
    const headerMap: Record<
      number,
      keyof Omit<PreviewRow, 'errors' | 'isValid' | 'rowIndex'>
    > = {};

    headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const rawHeader = String(cell.value ?? '');
      const normalized = rawHeader.trim().toLowerCase();
      const fieldKey = HEADER_TO_FIELD_MAP[normalized];
      if (fieldKey) {
        headerMap[colNumber] = fieldKey;
      }
    });

    const results: PreviewRow[] = [];
    let dataRowIndex = 0;

    // Iterate data rows (skip header row 1)
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return; // skip header

      const rawData: Partial<
        Record<
          keyof Omit<PreviewRow, 'errors' | 'isValid' | 'rowIndex'>,
          string
        >
      > = {};

      // Extract cell values for known columns
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const fieldKey = headerMap[colNumber];
        if (fieldKey) {
          rawData[fieldKey] = this.getCellStringValue(cell);
        }
      });

      // Count non-empty fields and check if any required field is present
      let nonEmptyCount = 0;
      let hasRequiredField = false;

      for (const [key, val] of Object.entries(rawData)) {
        if (val && val.trim() !== '') {
          nonEmptyCount++;
          if (REQUIRED_FIELDS.includes(key as any)) {
            hasRequiredField = true;
          }
        }
      }

      if (nonEmptyCount === 0 || (nonEmptyCount === 1 && !hasRequiredField)) {
        return; // skip this empty or stray row
      }

      // Normalize type
      const rawType = (rawData.type ?? '').trim();
      let normalizedType = 'Installation';
      if (rawType) {
        const lowerType = rawType.toLowerCase();
        if (lowerType === 'service') {
          normalizedType = 'Service';
        } else if (lowerType === 'installation') {
          normalizedType = 'Installation';
        } else {
          normalizedType = rawType; // Let validator catch invalid values
        }
      }

      // Build a complete PreviewRow with empty strings for missing fields
      const previewRow: PreviewRow = {
        invoice_no: rawData.invoice_no ?? '',
        type: normalizedType,
        invoice_date: rawData.invoice_date ?? '',
        ref_no: rawData.ref_no ?? '',
        frame_no: rawData.frame_no ?? '',
        mfg_date: rawData.mfg_date ?? '',
        mc_model: rawData.mc_model ?? '',
        mill_name: rawData.mill_name ?? '',
        customer_name: rawData.customer_name ?? '',
        place: rawData.place ?? '',
        state: rawData.state ?? '',
        phone_no: rawData.phone_no ?? '',
        address: rawData.address ?? '',
        installation_date: rawData.installation_date ?? '',
        warranty_start_date: rawData.warranty_start_date ?? '',
        warranty_years: rawData.warranty_years ?? '',
        warranty_months: rawData.warranty_months ?? '',
        amc_starting_date: rawData.amc_starting_date ?? '',
        amc_closing_date: rawData.amc_closing_date ?? '',
        amc_period: rawData.amc_period ?? '',
        amc_amount: rawData.amc_amount ?? '',
        amc_particulars: rawData.amc_particulars ?? '',
        errors: {},
        isValid: true,
        rowIndex: dataRowIndex,
      };

      // Validate required fields — must be present and non-empty
      for (const field of REQUIRED_FIELDS) {
        const value = previewRow[field] as string;
        if (!value || value.trim() === '') {
          previewRow.errors[field as string] = `${field} is required`;
        }
      }

      // Validate date fields — must be parseable when present
      for (const field of DATE_FIELDS) {
        const value = previewRow[field] as string;
        if (value && value.trim() !== '') {
          if (!this.isValidDate(value)) {
            previewRow.errors[field as string] =
              `${field} must be a valid date`;
          }
        }
      }

      // Validate numeric fields — must be numeric when present
      for (const field of NUMERIC_FIELDS) {
        const value = previewRow[field] as string;
        if (value && value.trim() !== '') {
          if (!this.isNumeric(value)) {
            previewRow.errors[field as string] =
              `${field} must be a numeric value`;
          }
        }
      }

      // Validate record type — must be 'Installation' or 'Service'
      if (previewRow.type !== 'Installation' && previewRow.type !== 'Service') {
        previewRow.errors['type'] =
          "Record Type must be 'Installation' or 'Service'";
      }

      // Set isValid based on whether there are any errors
      previewRow.isValid = Object.keys(previewRow.errors).length === 0;

      results.push(previewRow);
      dataRowIndex++;
    });

    return results;
  }

  /**
   * Extracts a string value from an ExcelJS cell, handling various cell types.
   */
  private getCellStringValue(cell: ExcelJS.Cell): string {
    const value = cell.value;

    if (value === null || value === undefined) {
      return '';
    }

    if (value instanceof Date) {
      // Format date as DD/MM/YYYY to preserve original display format
      const day = String(value.getDate()).padStart(2, '0');
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const year = value.getFullYear();
      return `${day}/${month}/${year}`;
    }

    if (typeof value === 'object' && 'richText' in value) {
      // Rich text
      return value.richText.map((rt) => rt.text).join('');
    }

    if (typeof value === 'object' && 'result' in value) {
      // Formula — use the cached result
      const formulaValue = value as ExcelJS.CellFormulaValue;
      return String(formulaValue.result ?? '');
    }

    if (typeof value === 'object' && 'text' in value) {
      // Hyperlink
      return String(value.text ?? '');
    }

    return String(value);
  }

  /**
   * Checks if a string is a parseable date value.
   * Accepts common formats: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, etc.
   */
  private isValidDate(value: string): boolean {
    const trimmed = value.trim();
    if (!trimmed) return false;

    // Try DD/MM/YYYY format first (most common in Indian locale)
    const ddmmyyyy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const ddmmMatch = trimmed.match(ddmmyyyy);
    if (ddmmMatch) {
      const [, day, month, year] = ddmmMatch;
      const d = Number(day);
      const m = Number(month);
      const y = Number(year);
      if (m < 1 || m > 12 || d < 1 || d > 31) return false;
      const parsed = new Date(y, m - 1, d);
      return (
        !isNaN(parsed.getTime()) &&
        parsed.getDate() === d &&
        parsed.getMonth() === m - 1 &&
        parsed.getFullYear() === y
      );
    }

    // Try native Date parsing (handles ISO, MM/DD/YYYY, etc.)
    const date = new Date(trimmed);
    return !isNaN(date.getTime());
  }

  /**
   * Checks if a string represents a valid numeric value.
   */
  private isNumeric(value: string): boolean {
    const trimmed = value.trim();
    if (!trimmed) return false;
    return !isNaN(Number(trimmed));
  }
}
