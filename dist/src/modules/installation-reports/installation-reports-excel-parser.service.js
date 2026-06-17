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
exports.InstallationReportsExcelParserService = void 0;
const common_1 = require("@nestjs/common");
const ExcelJS = __importStar(require("exceljs"));
const TEMPLATE_HEADERS = [
    'Mill Name',
    'Place',
    'Technician Names',
    'Visit Date',
    'Visit Time',
    'Call Registered Date',
    'Mill WhatsApp Number',
    'Mill Email',
    'Machine Model',
    'Serial / Frame No',
    'Authorized Person',
    'Authorized Person Phone',
    'Invoice Number',
    'Invoice Date',
    'Warranty Start Date',
    'Warranty End Date',
    'Commodity',
    'Contamination',
    'Output Capacity/Hour',
    'Rejection Ratio',
    'Purity',
    'No of Programs Set',
    'AC Provided (Yes/No)',
    'Compressor Details',
    'Air Drier Details',
    'Ground Earth Provided (Yes/No)',
    'Running Channel Combination',
    'Running Channel Combination Value',
    'No of Filters Installed',
    'Oil Filter Condition',
    'Line Filter Condition',
    'Auto Drain Valve Working (Yes/No)',
    'Engineer Remarks',
    'Customer Remarks',
    'Status',
];
const EXAMPLE_ROW = [
    'G.S.Industries',
    'Agra',
    'Sanjay',
    '30/06/2026',
    '10:00',
    '25/06/2026',
    '9876543210',
    'gs@example.com',
    'MarkSort Pro 500',
    'SN-2026-00001',
    'Rajesh Kumar',
    '9876500001',
    'IR-INV-100234',
    '15/06/2026',
    '30/06/2026',
    '30/06/2027',
    'Rice',
    '2%',
    '500 kg/hr',
    '0.5%',
    '99.5%',
    '5',
    'No',
    'Atlas Copco GA11',
    'Refrigerated type',
    'Yes',
    '3',
    'PRIMARY',
    '2',
    'Good',
    'Clean',
    'Yes',
    'Installation completed successfully',
    'Happy with the installation',
    'COMPLETED',
];
const HEADER_TO_FIELD_MAP = {
    'mill name': 'mill_name',
    'place': 'place',
    'technician names': 'technician_names',
    'visit date': 'visit_date',
    'visit time': 'visit_time',
    'call registered date': 'call_registered_date',
    'mill whatsapp number': 'mill_whatsapp_number',
    'mill email': 'mill_email',
    'machine model': 'machine_model',
    'serial / frame no': 'serial_or_frame_no',
    'authorized person': 'authorized_person',
    'authorized person phone': 'authorized_person_phone',
    'invoice number': 'invoice_number',
    'invoice date': 'invoice_date',
    'warranty start date': 'warranty_start_date',
    'warranty end date': 'warranty_end_date',
    'commodity': 'commodity',
    'contamination': 'contamination',
    'output capacity/hour': 'output_capacity_per_hour',
    'rejection ratio': 'rejection_ratio',
    'purity': 'purity',
    'no of programs set': 'no_of_programs_set',
    'ac provided (yes/no)': 'ac_provided',
    'compressor details': 'compressor_details',
    'air drier details': 'air_drier_details',
    'ground earth provided (yes/no)': 'ground_earth_provided',
    'running channel combination': 'running_channel_combination',
    'running channel combination value': 'running_channel_combination_value',
    'no of filters installed': 'no_of_filters_installed',
    'oil filter condition': 'oil_filter_condition',
    'line filter condition': 'line_filter_condition',
    'auto drain valve working (yes/no)': 'auto_drain_valve_working',
    'engineer remarks': 'engineer_remarks',
    'customer remarks': 'customer_remarks',
    'status': 'status',
};
const REQUIRED_FIELDS = [
    'mill_name',
    'place',
    'technician_names',
    'visit_date',
    'call_registered_date',
    'machine_model',
    'serial_or_frame_no',
    'authorized_person',
    'engineer_remarks',
];
const DATE_FIELDS = [
    'visit_date',
    'call_registered_date',
    'invoice_date',
    'warranty_start_date',
    'warranty_end_date',
];
const YES_NO_FIELDS = [
    'ac_provided',
    'ground_earth_provided',
    'auto_drain_valve_working',
];
const VALID_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const VALID_CHANNEL_VALUES = ['PRIMARY', 'SECONDARY', 'REJECTION_1', 'REJECTION_2', 'SPLIT'];
let InstallationReportsExcelParserService = class InstallationReportsExcelParserService {
    async generateTemplate() {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Installation Reports');
        worksheet.columns = TEMPLATE_HEADERS.map((header) => ({
            header,
            key: header,
            width: Math.max(header.length + 6, 20),
        }));
        const headerRow = worksheet.getRow(1);
        headerRow.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE56B00' },
            };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });
        worksheet.addRow(EXAMPLE_ROW);
        const info = workbook.addWorksheet('Instructions');
        info.getCell('A1').value = 'Installation Report Bulk Upload — Instructions';
        info.getCell('A1').font = { bold: true, size: 14 };
        info.getCell('A3').value = 'Required Columns (cannot be empty):';
        info.getCell('A3').font = { bold: true };
        REQUIRED_FIELDS.forEach((f, i) => {
            info.getCell(`A${4 + i}`).value = `• ${f.replace(/_/g, ' ')}`;
        });
        const baseRow = 4 + REQUIRED_FIELDS.length + 1;
        info.getCell(`A${baseRow}`).value = 'Date format: DD/MM/YYYY — e.g. 30/06/2026';
        info.getCell(`A${baseRow + 1}`).value = 'Status values: PENDING, IN_PROGRESS, COMPLETED, CANCELLED (defaults to PENDING if blank)';
        info.getCell(`A${baseRow + 2}`).value = 'Yes/No fields (AC Provided, Ground Earth Provided, Auto Drain Valve): Yes or No';
        info.getCell(`A${baseRow + 3}`).value = 'Running Channel Combination Value: PRIMARY, SECONDARY, REJECTION_1, REJECTION_2, SPLIT';
        info.getCell(`A${baseRow + 4}`).value = 'Running Channel Combination: integer 1-12';
        info.getCell(`A${baseRow + 5}`).value = 'Technician Names: comma-separated, must match existing technician names exactly';
        const arrayBuffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(arrayBuffer);
    }
    async parseAndValidate(buffer) {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        const worksheet = workbook.worksheets[0];
        if (!worksheet)
            return [];
        const headerRow = worksheet.getRow(1);
        const headerMap = {};
        headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
            const normalized = String(cell.value ?? '').trim().toLowerCase();
            const fieldKey = HEADER_TO_FIELD_MAP[normalized];
            if (fieldKey)
                headerMap[colNumber] = fieldKey;
        });
        const results = [];
        let dataRowIndex = 0;
        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            if (rowNumber === 1)
                return;
            const rawData = {};
            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                const fieldKey = headerMap[colNumber];
                if (fieldKey)
                    rawData[fieldKey] = this.getCellStringValue(cell);
            });
            const previewRow = {
                mill_name: rawData.mill_name ?? '',
                place: rawData.place ?? '',
                technician_names: rawData.technician_names ?? '',
                visit_date: rawData.visit_date ?? '',
                visit_time: rawData.visit_time ?? '',
                call_registered_date: rawData.call_registered_date ?? '',
                mill_whatsapp_number: rawData.mill_whatsapp_number ?? '',
                mill_email: rawData.mill_email ?? '',
                machine_model: rawData.machine_model ?? '',
                serial_or_frame_no: rawData.serial_or_frame_no ?? '',
                authorized_person: rawData.authorized_person ?? '',
                authorized_person_phone: rawData.authorized_person_phone ?? '',
                invoice_number: rawData.invoice_number ?? '',
                invoice_date: rawData.invoice_date ?? '',
                warranty_start_date: rawData.warranty_start_date ?? '',
                warranty_end_date: rawData.warranty_end_date ?? '',
                commodity: rawData.commodity ?? '',
                contamination: rawData.contamination ?? '',
                output_capacity_per_hour: rawData.output_capacity_per_hour ?? '',
                rejection_ratio: rawData.rejection_ratio ?? '',
                purity: rawData.purity ?? '',
                no_of_programs_set: rawData.no_of_programs_set ?? '',
                ac_provided: rawData.ac_provided ?? 'No',
                compressor_details: rawData.compressor_details ?? '',
                air_drier_details: rawData.air_drier_details ?? '',
                ground_earth_provided: rawData.ground_earth_provided ?? 'No',
                running_channel_combination: rawData.running_channel_combination ?? '',
                running_channel_combination_value: rawData.running_channel_combination_value ?? '',
                no_of_filters_installed: rawData.no_of_filters_installed ?? '',
                oil_filter_condition: rawData.oil_filter_condition ?? '',
                line_filter_condition: rawData.line_filter_condition ?? '',
                auto_drain_valve_working: rawData.auto_drain_valve_working ?? 'No',
                engineer_remarks: rawData.engineer_remarks ?? '',
                customer_remarks: rawData.customer_remarks ?? '',
                status: rawData.status ?? 'PENDING',
                errors: {},
                isValid: true,
                rowIndex: dataRowIndex,
            };
            for (const field of REQUIRED_FIELDS) {
                const value = previewRow[field];
                if (!value || value.trim() === '') {
                    previewRow.errors[field] = `${field.replace(/_/g, ' ')} is required`;
                }
            }
            for (const field of DATE_FIELDS) {
                const value = previewRow[field];
                if (value && value.trim() !== '' && !this.isValidDate(value)) {
                    previewRow.errors[field] = `${field.replace(/_/g, ' ')} must be a valid date (DD/MM/YYYY)`;
                }
            }
            for (const field of YES_NO_FIELDS) {
                const value = previewRow[field].trim().toLowerCase();
                if (value !== '' && value !== 'yes' && value !== 'no') {
                    previewRow.errors[field] = `${field.replace(/_/g, ' ')} must be "Yes" or "No"`;
                }
            }
            if (previewRow.status.trim() !== '') {
                const upper = previewRow.status.trim().toUpperCase();
                if (!VALID_STATUSES.includes(upper)) {
                    previewRow.errors['status'] = `Status must be one of: ${VALID_STATUSES.join(', ')}`;
                }
                else {
                    previewRow.status = upper;
                }
            }
            else {
                previewRow.status = 'PENDING';
            }
            if (previewRow.running_channel_combination.trim() !== '') {
                const n = Number(previewRow.running_channel_combination.trim());
                if (!Number.isInteger(n) || n < 1 || n > 12) {
                    previewRow.errors['running_channel_combination'] =
                        'Running channel combination must be an integer between 1 and 12';
                }
            }
            if (previewRow.running_channel_combination_value.trim() !== '') {
                const upper = previewRow.running_channel_combination_value.trim().toUpperCase();
                if (!VALID_CHANNEL_VALUES.includes(upper)) {
                    previewRow.errors['running_channel_combination_value'] =
                        `Running channel combination value must be one of: ${VALID_CHANNEL_VALUES.join(', ')}`;
                }
                else {
                    previewRow.running_channel_combination_value = upper;
                }
            }
            const intFields = ['no_of_programs_set', 'no_of_filters_installed'];
            for (const field of intFields) {
                const value = previewRow[field];
                if (value.trim() !== '') {
                    const n = Number(value.trim());
                    if (!Number.isInteger(n) || n < 0) {
                        previewRow.errors[field] = `${field.replace(/_/g, ' ')} must be a non-negative integer`;
                    }
                }
            }
            previewRow.isValid = Object.keys(previewRow.errors).length === 0;
            results.push(previewRow);
            dataRowIndex++;
        });
        return results;
    }
    getCellStringValue(cell) {
        const value = cell.value;
        if (value === null || value === undefined)
            return '';
        if (value instanceof Date) {
            const day = String(value.getDate()).padStart(2, '0');
            const month = String(value.getMonth() + 1).padStart(2, '0');
            const year = value.getFullYear();
            return `${day}/${month}/${year}`;
        }
        if (typeof value === 'object' && 'richText' in value) {
            return value.richText.map((rt) => rt.text).join('');
        }
        if (typeof value === 'object' && 'result' in value) {
            return String(value.result ?? '');
        }
        if (typeof value === 'object' && 'text' in value) {
            return String(value.text ?? '');
        }
        return String(value);
    }
    isValidDate(value) {
        const trimmed = value.trim();
        if (!trimmed)
            return false;
        const ddmmyyyy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
        if (ddmmyyyy) {
            const [, day, month, year] = ddmmyyyy;
            const d = Number(day), m = Number(month), y = Number(year);
            if (m < 1 || m > 12 || d < 1 || d > 31)
                return false;
            const parsed = new Date(y, m - 1, d);
            return (!isNaN(parsed.getTime()) &&
                parsed.getDate() === d &&
                parsed.getMonth() === m - 1 &&
                parsed.getFullYear() === y);
        }
        const date = new Date(trimmed);
        return !isNaN(date.getTime());
    }
};
exports.InstallationReportsExcelParserService = InstallationReportsExcelParserService;
exports.InstallationReportsExcelParserService = InstallationReportsExcelParserService = __decorate([
    (0, common_1.Injectable)()
], InstallationReportsExcelParserService);
//# sourceMappingURL=installation-reports-excel-parser.service.js.map