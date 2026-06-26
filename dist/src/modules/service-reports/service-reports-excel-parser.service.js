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
exports.ServiceReportsExcelParserService = void 0;
const common_1 = require("@nestjs/common");
const ExcelJS = __importStar(require("exceljs"));
const TEMPLATE_HEADERS = [
    'Mill Name',
    'Place',
    'Service Category',
    'Technician Names',
    'Visit Date',
    'Visit Time',
    'Call Registered Date',
    'Mill WhatsApp Number',
    'Mill Email',
    'Machine Model',
    'Mfg Date',
    'Installation Date',
    'Serial / Frame No',
    'Authorized Person',
    'Authorized Person Phone',
    'Previous Visit Engineer',
    'Nature of Complaint',
    'Problem Observed',
    'Action Taken',
    'Commodity',
    'Contamination',
    'Output Capacity/Hour',
    'Rejection Ratio',
    'Purity',
    'No of Programs Set',
    'AC Provided (Yes/No)',
    'Compressor Details',
    'Air Drier Details',
    'Line Filter Condition',
    'Machine Filter Condition',
    'Auto Drain Valve Working (Yes/No)',
    'Engineer Remarks',
    'Customer Remarks',
    'Status',
];
const EXAMPLE_ROW = [
    'ABC Mills',
    'Chennai',
    'AMC WITH SPARE',
    'Sanjay, Ramesh',
    '15/06/2026',
    '10:30',
    '10/06/2026',
    '9876543210',
    'mill@example.com',
    'MarkSort Pro 500',
    '01/01/2020',
    '15/06/2020',
    'SN-2024-00123',
    'Rajesh Kumar',
    '9876543210',
    'Suresh Babu',
    'Machine not sorting correctly at high speed',
    'Vibration noise from sorting chamber',
    'Cleaned sensors and recalibrated sorting thresholds',
    'Rice',
    '2%',
    '500 kg/hr',
    '0.5%',
    '99.5%',
    '5',
    'No',
    'Atlas Copco GA11',
    'Refrigerated type',
    'Clean',
    'Needs replacement',
    'Yes',
    'Machine is now operating within normal parameters',
    'Satisfied with the service',
    'PENDING',
];
const HEADER_TO_FIELD_MAP = {
    'mill name': 'mill_name',
    place: 'place',
    'service category': 'service_category_name',
    'technician names': 'technician_names',
    'visit date': 'visit_date',
    'visit time': 'visit_time',
    'call registered date': 'call_registered_date',
    'mill whatsapp number': 'mill_whatsapp_number',
    'mill email': 'mill_email',
    'machine model': 'machine_model',
    'mfg date': 'machine_mfg_date',
    'installation date': 'machine_installation_date',
    'serial / frame no': 'serial_or_frame_no',
    'authorized person': 'authorized_person',
    'authorized person phone': 'authorized_person_phone',
    'previous visit engineer': 'previous_visit_engineer',
    'nature of complaint': 'nature_of_complaint',
    'problem observed': 'problem_observed',
    'action taken': 'action_taken',
    commodity: 'commodity',
    contamination: 'contamination',
    'output capacity/hour': 'output_capacity_per_hour',
    'rejection ratio': 'rejection_ratio',
    purity: 'purity',
    'no of programs set': 'no_of_programs_set',
    'ac provided (yes/no)': 'ac_provided',
    'compressor details': 'compressor_details',
    'air drier details': 'air_drier_details',
    'line filter condition': 'line_filter_condition',
    'machine filter condition': 'machine_filter_condition',
    'auto drain valve working (yes/no)': 'auto_drain_valve_working',
    'engineer remarks': 'engineer_remarks',
    'customer remarks': 'customer_remarks',
    status: 'status',
};
const REQUIRED_FIELDS = [
    'mill_name',
    'place',
    'service_category_name',
    'technician_names',
    'visit_date',
    'call_registered_date',
    'machine_model',
    'serial_or_frame_no',
    'authorized_person',
    'nature_of_complaint',
    'action_taken',
    'engineer_remarks',
];
const DATE_FIELDS = [
    'visit_date',
    'call_registered_date',
    'machine_mfg_date',
    'machine_installation_date',
];
const YES_NO_FIELDS = ['ac_provided', 'auto_drain_valve_working'];
const VALID_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
let ServiceReportsExcelParserService = class ServiceReportsExcelParserService {
    async generateTemplate() {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Service Reports');
        worksheet.columns = TEMPLATE_HEADERS.map((header) => ({
            header,
            key: header,
            width: Math.max(header.length + 6, 18),
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
        const infoSheet = workbook.addWorksheet('Instructions');
        infoSheet.getCell('A1').value = 'Service Report Bulk Upload — Instructions';
        infoSheet.getCell('A1').font = { bold: true, size: 14 };
        infoSheet.getCell('A3').value = 'Required Columns (cannot be empty):';
        infoSheet.getCell('A3').font = { bold: true };
        REQUIRED_FIELDS.forEach((field, i) => {
            infoSheet.getCell(`A${4 + i}`).value = `• ${field}`;
        });
        infoSheet.getCell(`A${4 + REQUIRED_FIELDS.length + 1}`).value =
            'Date format: DD/MM/YYYY — e.g. 15/06/2026';
        infoSheet.getCell(`A${4 + REQUIRED_FIELDS.length + 2}`).value =
            'Status values: PENDING, IN_PROGRESS, COMPLETED, CANCELLED (defaults to PENDING if blank)';
        infoSheet.getCell(`A${4 + REQUIRED_FIELDS.length + 3}`).value =
            'AC Provided / Auto Drain Valve: Yes or No (defaults to No if blank)';
        infoSheet.getCell(`A${4 + REQUIRED_FIELDS.length + 4}`).value =
            'Technician Names: comma-separated names matching existing technicians — e.g. "Sanjay, Ramesh"';
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
            const normalized = String(cell.value ?? '')
                .trim()
                .toLowerCase();
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
            const previewRow = {
                mill_name: rawData.mill_name ?? '',
                place: rawData.place ?? '',
                service_category_name: rawData.service_category_name ?? '',
                technician_names: rawData.technician_names ?? '',
                visit_date: rawData.visit_date ?? '',
                visit_time: rawData.visit_time ?? '',
                call_registered_date: rawData.call_registered_date ?? '',
                mill_whatsapp_number: rawData.mill_whatsapp_number ?? '',
                mill_email: rawData.mill_email ?? '',
                machine_model: rawData.machine_model ?? '',
                machine_mfg_date: rawData.machine_mfg_date ?? '',
                machine_installation_date: rawData.machine_installation_date ?? '',
                serial_or_frame_no: rawData.serial_or_frame_no ?? '',
                authorized_person: rawData.authorized_person ?? '',
                authorized_person_phone: rawData.authorized_person_phone ?? '',
                previous_visit_engineer: rawData.previous_visit_engineer ?? '',
                nature_of_complaint: rawData.nature_of_complaint ?? '',
                problem_observed: rawData.problem_observed ?? '',
                action_taken: rawData.action_taken ?? '',
                commodity: rawData.commodity ?? '',
                contamination: rawData.contamination ?? '',
                output_capacity_per_hour: rawData.output_capacity_per_hour ?? '',
                rejection_ratio: rawData.rejection_ratio ?? '',
                purity: rawData.purity ?? '',
                no_of_programs_set: rawData.no_of_programs_set ?? '',
                ac_provided: rawData.ac_provided ?? 'No',
                compressor_details: rawData.compressor_details ?? '',
                air_drier_details: rawData.air_drier_details ?? '',
                line_filter_condition: rawData.line_filter_condition ?? '',
                machine_filter_condition: rawData.machine_filter_condition ?? '',
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
                    previewRow.errors[field] =
                        `${field.replace(/_/g, ' ')} must be a valid date (DD/MM/YYYY)`;
                }
            }
            for (const field of YES_NO_FIELDS) {
                const value = previewRow[field].trim().toLowerCase();
                if (value !== '' && value !== 'yes' && value !== 'no') {
                    previewRow.errors[field] =
                        `${field.replace(/_/g, ' ')} must be "Yes" or "No"`;
                }
            }
            if (previewRow.status.trim() !== '') {
                const upper = previewRow.status.trim().toUpperCase();
                if (!VALID_STATUSES.includes(upper)) {
                    previewRow.errors['status'] =
                        `Status must be one of: ${VALID_STATUSES.join(', ')}`;
                }
                else {
                    previewRow.status = upper;
                }
            }
            else {
                previewRow.status = 'PENDING';
            }
            if (previewRow.no_of_programs_set.trim() !== '') {
                const n = Number(previewRow.no_of_programs_set.trim());
                if (!Number.isInteger(n) || n < 0) {
                    previewRow.errors['no_of_programs_set'] =
                        'No of programs set must be a non-negative integer';
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
        const ddmmyyyy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
        const match = trimmed.match(ddmmyyyy);
        if (match) {
            const [, day, month, year] = match;
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
exports.ServiceReportsExcelParserService = ServiceReportsExcelParserService;
exports.ServiceReportsExcelParserService = ServiceReportsExcelParserService = __decorate([
    (0, common_1.Injectable)()
], ServiceReportsExcelParserService);
//# sourceMappingURL=service-reports-excel-parser.service.js.map