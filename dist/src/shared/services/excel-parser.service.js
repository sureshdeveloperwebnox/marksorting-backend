"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExcelParserService = void 0;
const common_1 = require("@nestjs/common");
const ExcelJS = __importStar(require("exceljs"));
const TEMPLATE_HEADERS = [
    'Invoice No',
    'Invoice Date',
    'Ref No',
    'Mill Name',
    'Customer Name',
    'Place',
    'State',
    'Phone No',
    'Address',
    'Frame No',
    'MC Model',
    'MFG Date',
    'Installation Date',
    'Warranty Start Date',
    'Warranty Period (Months)',
    'AMC Starting Date',
    'AMC Closing Date',
    'AMC Period (Months)',
    'AMC Amount',
    'AMC Particulars',
];
const EXAMPLE_ROW = [
    'INV-001',
    '01/01/2024',
    'REF-001',
    'ABC Mills',
    'John Doe',
    'Chennai',
    'Tamil Nadu',
    '',
    '123, Main Street, Chennai - 600001',
    'FRM-001',
    'Model XYZ',
    '01/01/2024',
    '15/01/2024',
    '15/01/2024',
    '12',
    '01/02/2024',
    '01/02/2025',
    '12',
    '5000',
    'Annual Maintenance Contract',
];
const HEADER_TO_FIELD_MAP = {
    'invoice no': 'invoice_no',
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
    'warranty period (months)': 'warranty_months',
    'warranty years': 'warranty_years',
    'warranty months': 'warranty_months',
    'amc starting date': 'amc_starting_date',
    'amc closing date': 'amc_closing_date',
    'amc period (months)': 'amc_period',
    'amc amount': 'amc_amount',
    'amc particulars': 'amc_particulars',
};
const REQUIRED_FIELDS = [
    'invoice_no',
    'ref_no',
    'mill_name',
    'place',
];
const DATE_FIELDS = [
    'invoice_date',
    'installation_date',
    'warranty_start_date',
    'mfg_date',
    'amc_starting_date',
    'amc_closing_date',
];
const NUMERIC_FIELDS = [
    'warranty_years',
    'warranty_months',
    'amc_period',
    'amc_amount',
];
let ExcelParserService = class ExcelParserService {
    async generateTemplate() {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Template');
        worksheet.columns = TEMPLATE_HEADERS.map((header) => ({
            header,
            key: header,
            width: Math.max(header.length + 4, 15),
        }));
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
        worksheet.addRow(EXAMPLE_ROW);
        const arrayBuffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(arrayBuffer);
    }
    async parseAndValidate(buffer) {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        const worksheet = workbook.worksheets[0];
        if (!worksheet) {
            return [];
        }
        let dataRowCount = 0;
        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            if (rowNumber > 1)
                dataRowCount++;
        });
        if (dataRowCount > 25000) {
            throw new common_1.BadRequestException('We cannot handle more than 25,000 rows in a single file. Kindly split and upload.');
        }
        const headerRow = worksheet.getRow(1);
        const headerMap = {};
        headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
            const rawHeader = String(cell.value ?? '');
            const normalized = rawHeader.trim().toLowerCase();
            const fieldKey = HEADER_TO_FIELD_MAP[normalized];
            if (fieldKey) {
                headerMap[colNumber] = fieldKey;
            }
        });
        const results = [];
        let dataRowIndex = 0;
        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            if (rowNumber === 1)
                return;
            const rawData = {};
            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                const fieldKey = headerMap[colNumber];
                if (fieldKey) {
                    rawData[fieldKey] = this.getCellStringValue(cell);
                }
            });
            let nonEmptyCount = 0;
            let hasRequiredField = false;
            for (const [key, val] of Object.entries(rawData)) {
                if (val && val.trim() !== '') {
                    nonEmptyCount++;
                    if (REQUIRED_FIELDS.includes(key)) {
                        hasRequiredField = true;
                    }
                }
            }
            if (nonEmptyCount === 0 || (nonEmptyCount === 1 && !hasRequiredField)) {
                return;
            }
            const cleanInvoiceNo = this.cleanGenericString(rawData.invoice_no);
            const cleanRefNo = this.cleanGenericString(rawData.ref_no);
            const cleanMillName = this.cleanGenericString(rawData.mill_name);
            let cleanPlace = this.cleanGenericString(rawData.place);
            const cleanAddress = this.cleanGenericString(rawData.address);
            if (!cleanPlace && cleanAddress) {
                cleanPlace = cleanAddress.split(/[\r\n,-]/)[0]?.trim() || cleanAddress;
            }
            if (!cleanPlace) {
                cleanPlace = 'Unknown';
            }
            const previewRow = {
                invoice_no: cleanInvoiceNo || '',
                invoice_date: this.cleanDateString(rawData.invoice_date),
                ref_no: cleanRefNo || '',
                frame_no: this.cleanGenericString(rawData.frame_no),
                mfg_date: this.cleanDateString(rawData.mfg_date),
                mc_model: this.cleanGenericString(rawData.mc_model),
                mill_name: cleanMillName || '',
                customer_name: this.cleanGenericString(rawData.customer_name),
                place: cleanPlace,
                state: this.cleanGenericString(rawData.state),
                phone_no: this.cleanGenericString(rawData.phone_no),
                address: cleanAddress,
                installation_date: this.cleanDateString(rawData.installation_date),
                warranty_start_date: this.cleanDateString(rawData.warranty_start_date),
                warranty_years: this.cleanNumericString(rawData.warranty_years),
                warranty_months: this.cleanNumericString(rawData.warranty_months),
                amc_starting_date: this.cleanDateString(rawData.amc_starting_date),
                amc_closing_date: this.cleanDateString(rawData.amc_closing_date),
                amc_period: this.cleanNumericString(rawData.amc_period),
                amc_amount: this.cleanNumericString(rawData.amc_amount),
                amc_particulars: this.cleanGenericString(rawData.amc_particulars),
                errors: {},
                isValid: true,
                rowIndex: dataRowIndex,
            };
            if (!previewRow.ref_no) {
                previewRow.errors.ref_no = 'Ref No is required';
            }
            if (!previewRow.mill_name) {
                previewRow.errors.mill_name = 'Mill Name is required';
            }
            if (!previewRow.invoice_no) {
                previewRow.invoice_no = previewRow.ref_no
                    ? `INV-${previewRow.ref_no}`
                    : `INV-${dataRowIndex + 1}`;
            }
            for (const field of DATE_FIELDS) {
                const value = previewRow[field];
                if (value && value.trim() !== '') {
                    if (!this.isValidDate(value)) {
                        previewRow.errors[field] =
                            `${field} must be a valid date`;
                    }
                }
            }
            for (const field of NUMERIC_FIELDS) {
                const value = previewRow[field];
                if (value && value.trim() !== '') {
                    if (!this.isNumeric(value)) {
                        previewRow.errors[field] =
                            `${field} must be a numeric value`;
                    }
                }
            }
            previewRow.isValid = Object.keys(previewRow.errors).length === 0;
            results.push(previewRow);
            dataRowIndex++;
        });
        return results;
    }
    cleanGenericString(val) {
        if (val === null || val === undefined)
            return '';
        const str = String(val).trim();
        if ([
            '#num!',
            '#value!',
            '#ref!',
            '#n/a',
            'n/a',
            'na',
            'null',
            'undefined',
            'invalid date',
            '-',
            '--',
            '.',
        ].includes(str.toLowerCase())) {
            return '';
        }
        return str;
    }
    cleanDateString(val) {
        const str = this.cleanGenericString(val);
        if (!str)
            return '';
        if ([
            '00-01-1900',
            '00/00/0000',
            '00:00:00',
            '0/0/00',
            '01-01-1970',
            '01/01/1970',
            '1900-01-00',
            '1900-01-01',
        ].includes(str)) {
            return '';
        }
        if (/[a-zA-Z]{4,}/.test(str)) {
            return '';
        }
        return str;
    }
    cleanNumericString(val) {
        const str = this.cleanGenericString(val);
        if (!str)
            return '';
        const cleaned = str.replace(/,/g, '').replace(/[^\d.-]/g, '');
        if (cleaned && !isNaN(Number(cleaned))) {
            return cleaned;
        }
        return '';
    }
    getCellStringValue(cell) {
        const value = cell.value;
        if (value === null || value === undefined) {
            return '';
        }
        if (value instanceof Date) {
            if (isNaN(value.getTime()) || value.getFullYear() <= 1900) {
                return '';
            }
            const day = String(value.getDate()).padStart(2, '0');
            const month = String(value.getMonth() + 1).padStart(2, '0');
            const year = value.getFullYear();
            return `${day}/${month}/${year}`;
        }
        if (typeof value === 'object' && 'richText' in value) {
            return value.richText.map((rt) => rt.text).join('');
        }
        if (typeof value === 'object' && 'result' in value) {
            const formulaResult = value.result;
            if (formulaResult instanceof Date) {
                if (isNaN(formulaResult.getTime()) || formulaResult.getFullYear() <= 1900) {
                    return '';
                }
                const day = String(formulaResult.getDate()).padStart(2, '0');
                const month = String(formulaResult.getMonth() + 1).padStart(2, '0');
                const year = formulaResult.getFullYear();
                return `${day}/${month}/${year}`;
            }
            return String(formulaResult ?? '');
        }
        if (typeof value === 'object' && 'text' in value) {
            return String(value.text ?? '');
        }
        return String(value);
    }
    isValidDate(value) {
        const trimmed = value.trim();
        if (!trimmed)
            return true;
        const ddmmyyyy = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;
        const ddmmMatch = trimmed.match(ddmmyyyy);
        if (ddmmMatch) {
            const [, day, month, year] = ddmmMatch;
            const d = Number(day);
            const m = Number(month);
            const y = Number(year);
            if (m < 1 || m > 12 || d < 1 || d > 31)
                return false;
            if (y < 1950 || y > 2100)
                return false;
            const parsed = new Date(y, m - 1, d);
            return (!isNaN(parsed.getTime()) &&
                parsed.getDate() === d &&
                parsed.getMonth() === m - 1 &&
                parsed.getFullYear() === y);
        }
        const date = new Date(trimmed);
        return !isNaN(date.getTime()) && date.getFullYear() >= 1950;
    }
    isNumeric(value) {
        const trimmed = value.trim();
        if (!trimmed)
            return false;
        return !isNaN(Number(trimmed));
    }
};
exports.ExcelParserService = ExcelParserService;
exports.ExcelParserService = ExcelParserService = __decorate([
    (0, common_1.Injectable)()
], ExcelParserService);
//# sourceMappingURL=excel-parser.service.js.map