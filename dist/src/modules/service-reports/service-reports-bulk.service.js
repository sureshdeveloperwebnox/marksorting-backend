"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceReportsBulkService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../../prisma/prisma.service");
const redis_service_1 = require("../../redis/redis.service");
const service_reports_excel_parser_service_1 = require("./service-reports-excel-parser.service");
let ServiceReportsBulkService = class ServiceReportsBulkService {
    excelParser;
    prisma;
    redis;
    constructor(excelParser, prisma, redis) {
        this.excelParser = excelParser;
        this.prisma = prisma;
        this.redis = redis;
    }
    async generateTemplate() {
        return this.excelParser.generateTemplate();
    }
    async previewUpload(file) {
        if (!file) {
            throw new common_1.BadRequestException('No file uploaded');
        }
        let rows;
        try {
            rows = await this.excelParser.parseAndValidate(file.buffer);
        }
        catch {
            throw new common_1.BadRequestException('Unable to parse the uploaded file. Ensure it is a valid .xlsx or .xls file.');
        }
        if (rows.length === 0) {
            throw new common_1.BadRequestException('The uploaded file contains no data rows');
        }
        const importId = (0, crypto_1.randomUUID)();
        await this.redis.setJson(`sr_bulk_upload:preview:${importId}`, rows, 1800);
        const validRows = rows.filter((r) => r.isValid).length;
        const invalidRows = rows.length - validRows;
        return { importId, rows, totalRows: rows.length, validRows, invalidRows };
    }
    async confirmImport(importId) {
        const rows = await this.redis.getJson(`sr_bulk_upload:preview:${importId}`);
        if (!rows) {
            throw new common_1.NotFoundException('Preview session expired. Please re-upload the file.');
        }
        void this.processImport(importId, rows);
    }
    async getImportStatus(importId) {
        const status = await this.redis.getJson(`sr_bulk_upload:status:${importId}`);
        if (!status) {
            throw new common_1.NotFoundException('Import status not found. The session may have expired.');
        }
        return status;
    }
    async processImport(importId, rows) {
        const statusKey = `sr_bulk_upload:status:${importId}`;
        const status = {
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
                    }
                    catch {
                        status.errorCount++;
                    }
                }
                status.processedRows += batch.length;
                status.percentage = Math.round((status.processedRows / validRows.length) * 100);
                await this.redis.setJson(statusKey, status, 7200);
            }
            status.state = 'completed';
            status.percentage = 100;
            await this.redis.setJson(statusKey, status, 7200);
        }
        catch (error) {
            status.state = 'failed';
            status.errorMessage =
                error instanceof Error ? error.message : String(error);
            await this.redis.setJson(statusKey, status, 7200).catch(() => {
            });
        }
    }
    async importSingleRow(row) {
        await this.prisma.$transaction(async (tx) => {
            const category = await tx.serviceCategory.findFirst({
                where: {
                    name: { equals: row.service_category_name.trim(), mode: 'insensitive' },
                    deleted_at: null,
                },
                select: { id: true },
            });
            if (!category) {
                throw new Error(`Service category "${row.service_category_name}" not found`);
            }
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
            const rawNames = row.technician_names
                .split(',')
                .map((n) => n.trim())
                .filter(Boolean);
            const technicianIds = [];
            for (const name of rawNames) {
                const tech = await tx.technician.findFirst({
                    where: {
                        full_name: { equals: name, mode: 'insensitive' },
                        deleted_at: null,
                    },
                    select: { id: true },
                });
                if (tech)
                    technicianIds.push(tech.id);
            }
            if (technicianIds.length === 0) {
                throw new Error(`No matching technicians found for: "${row.technician_names}"`);
            }
            const todayStart = new Date();
            todayStart.setUTCHours(0, 0, 0, 0);
            const todayEnd = new Date();
            todayEnd.setUTCHours(23, 59, 59, 999);
            const count = await tx.serviceReport.count({
                where: { created_at: { gte: todayStart, lte: todayEnd } },
            });
            const dateStr = todayStart.toISOString().slice(0, 10).replace(/-/g, '');
            const report_number = `SR-${dateStr}-${count + 1}`;
            const parseDate = (val) => {
                const trimmed = val.trim();
                if (!trimmed)
                    return undefined;
                const ddmmyyyy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
                if (ddmmyyyy) {
                    const [, d, m, y] = ddmmyyyy;
                    return new Date(Number(y), Number(m) - 1, Number(d));
                }
                const d = new Date(trimmed);
                return isNaN(d.getTime()) ? undefined : d;
            };
            const created = await tx.serviceReport.create({
                data: {
                    report_number,
                    service_category_id: category.id,
                    mill_id: mill.id,
                    place: row.place.trim(),
                    mill_whatsapp_number: row.mill_whatsapp_number.trim() || mill.phone || '',
                    mill_email: row.mill_email.trim() || mill.email || undefined,
                    visit_date: parseDate(row.visit_date) ?? new Date(),
                    visit_time: row.visit_time.trim() || '00:00',
                    call_registered_date: parseDate(row.call_registered_date) ?? new Date(),
                    machine_model: row.machine_model.trim(),
                    machine_mfg_date: parseDate(row.machine_mfg_date),
                    machine_installation_date: parseDate(row.machine_installation_date),
                    serial_or_frame_no: row.serial_or_frame_no.trim(),
                    authorized_person: row.authorized_person.trim(),
                    authorized_person_phone: row.authorized_person_phone.trim() || undefined,
                    previous_visit_engineer: row.previous_visit_engineer.trim() || undefined,
                    nature_of_complaint: row.nature_of_complaint.trim(),
                    problem_observed: row.problem_observed.trim() || undefined,
                    action_taken: row.action_taken.trim(),
                    commodity: row.commodity.trim() || undefined,
                    contamination: row.contamination.trim() || undefined,
                    output_capacity_per_hour: row.output_capacity_per_hour.trim() || undefined,
                    rejection_ratio: row.rejection_ratio.trim() || undefined,
                    purity: row.purity.trim() || undefined,
                    no_of_programs_set: row.no_of_programs_set.trim()
                        ? parseInt(row.no_of_programs_set.trim(), 10)
                        : undefined,
                    ac_provided: row.ac_provided.trim().toLowerCase() === 'yes',
                    compressor_details: row.compressor_details.trim() || undefined,
                    air_drier_details: row.air_drier_details.trim() || undefined,
                    line_filter_condition: row.line_filter_condition.trim() || undefined,
                    machine_filter_condition: row.machine_filter_condition.trim() || undefined,
                    auto_drain_valve_working: row.auto_drain_valve_working.trim().toLowerCase() === 'yes',
                    engineer_remarks: row.engineer_remarks.trim(),
                    customer_remarks: row.customer_remarks.trim() || undefined,
                    engineer_signature: 'bulk-import',
                    customer_signature: 'bulk-import',
                    status: row.status || 'PENDING',
                },
            });
            await tx.serviceReportTechnician.createMany({
                data: technicianIds.map((tid) => ({
                    service_report_id: created.id,
                    technician_id: tid,
                })),
            });
        });
    }
};
exports.ServiceReportsBulkService = ServiceReportsBulkService;
exports.ServiceReportsBulkService = ServiceReportsBulkService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [service_reports_excel_parser_service_1.ServiceReportsExcelParserService,
        prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], ServiceReportsBulkService);
//# sourceMappingURL=service-reports-bulk.service.js.map