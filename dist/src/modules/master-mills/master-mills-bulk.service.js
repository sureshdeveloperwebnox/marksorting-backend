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
exports.MasterMillsBulkService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const excel_parser_service_1 = require("../../shared/services/excel-parser.service");
const master_mills_service_1 = require("./master-mills.service");
const redis_service_1 = require("../../redis/redis.service");
const prisma_service_1 = require("../../prisma/prisma.service");
let MasterMillsBulkService = class MasterMillsBulkService {
    excelParser;
    masterMillsService;
    redis;
    prisma;
    constructor(excelParser, masterMillsService, redis, prisma) {
        this.excelParser = excelParser;
        this.masterMillsService = masterMillsService;
        this.redis = redis;
        this.prisma = prisma;
    }
    parseExcelDate(value) {
        if (!value)
            return undefined;
        const trimmed = value.trim();
        if (!trimmed)
            return undefined;
        const ddmmyyyy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
        const match = trimmed.match(ddmmyyyy);
        if (match) {
            const [, day, month, year] = match;
            const d = String(day).padStart(2, '0');
            const m = String(month).padStart(2, '0');
            const y = year;
            return `${y}-${m}-${d}`;
        }
        const parsed = new Date(trimmed);
        if (!isNaN(parsed.getTime())) {
            return parsed.toISOString().split('T')[0];
        }
        return undefined;
    }
    async generateTemplate() {
        return this.excelParser.generateTemplate();
    }
    async previewUpload(file) {
        if (!file) {
            throw new common_1.BadRequestException('No file uploaded');
        }
        const rows = await this.excelParser.parseAndValidate(file.buffer);
        if (rows.length === 0) {
            throw new common_1.BadRequestException('The uploaded file contains no data rows');
        }
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
        const sheetRefNos = new Set();
        const sheetFrameNos = new Set();
        for (const row of rows) {
            const cleanRef = row.ref_no?.trim().toLowerCase();
            const cleanFrame = row.frame_no?.trim().toLowerCase();
            const cleanMillName = row.mill_name?.trim().toLowerCase();
            const cleanCustomerName = row.customer_name?.trim().toLowerCase();
            if (cleanRef) {
                if (sheetRefNos.has(cleanRef)) {
                    row.errors.ref_no = 'Duplicate Ref No in Excel sheet';
                }
            }
            if (cleanFrame) {
                if (sheetFrameNos.has(cleanFrame)) {
                    row.errors.frame_no = 'Duplicate Frame No in Excel sheet';
                }
            }
            if (cleanRef && !row.errors.ref_no) {
                const matchingMM = dbMasterMills.find((m) => m.ref_no?.trim().toLowerCase() === cleanRef);
                if (matchingMM) {
                    const isSameMill = matchingMM.mill?.name?.trim().toLowerCase() === cleanMillName &&
                        matchingMM.mill?.customer?.name?.trim().toLowerCase() === cleanCustomerName;
                    if (!isSameMill) {
                        row.errors.ref_no = 'Ref No already exists under a different customer or mill';
                    }
                }
            }
            if (cleanFrame && !row.errors.frame_no) {
                const matchingMM = dbMasterMills.find((m) => m.frame_no?.trim().toLowerCase() === cleanFrame);
                if (matchingMM) {
                    const isSameMill = matchingMM.mill?.name?.trim().toLowerCase() === cleanMillName &&
                        matchingMM.mill?.customer?.name?.trim().toLowerCase() === cleanCustomerName;
                    if (!isSameMill) {
                        row.errors.frame_no = 'Frame No already exists under a different customer or mill';
                    }
                }
            }
            if (row.errors.ref_no || row.errors.frame_no) {
                row.isValid = false;
            }
            if (cleanRef && !row.errors.ref_no) {
                sheetRefNos.add(cleanRef);
            }
            if (cleanFrame && !row.errors.frame_no) {
                sheetFrameNos.add(cleanFrame);
            }
        }
        const importId = (0, crypto_1.randomUUID)();
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
    async confirmImport(importId) {
        const rows = await this.redis.getJson(`bulk_upload:preview:${importId}`);
        if (!rows) {
            throw new common_1.NotFoundException('Preview session expired. Please re-upload the file.');
        }
        void this.processImport(importId, rows);
    }
    async getImportStatus(importId) {
        const status = await this.redis.getJson(`bulk_upload:status:${importId}`);
        if (!status) {
            throw new common_1.NotFoundException('Preview session expired. Please re-upload the file.');
        }
        return status;
    }
    async processImport(importId, rows) {
        const statusKey = `bulk_upload:status:${importId}`;
        const status = {
            state: 'processing',
            percentage: 0,
            processedRows: 0,
            createdCount: 0,
            updatedCount: 0,
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
                        const dto = {
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
                            mfg_date: this.parseExcelDate(row.mfg_date) || this.parseExcelDate(row.installation_date) || new Date().toISOString().split('T')[0],
                            invoice_no: row.invoice_no || undefined,
                            invoice_date: this.parseExcelDate(row.invoice_date),
                            installation_date: this.parseExcelDate(row.installation_date),
                            warranty_start_date: this.parseExcelDate(row.warranty_start_date),
                            warranty_years: row.warranty_years ? Number(row.warranty_years) : undefined,
                            warranty_months: row.warranty_months ? Number(row.warranty_months) : undefined,
                            amc_starting_date: this.parseExcelDate(row.amc_starting_date),
                            amc_closing_date: this.parseExcelDate(row.amc_closing_date),
                            amc_period: row.amc_period ? Number(row.amc_period) : undefined,
                            amc_amount: row.amc_amount ? Number(row.amc_amount) : undefined,
                            amc_particulars: row.amc_particulars || undefined,
                        };
                        const result = await this.masterMillsService.quickRegister(dto, { skipDuplicateCheck: false });
                        if (result?._isUpdate) {
                            status.updatedCount++;
                        }
                        else {
                            status.createdCount++;
                        }
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
};
exports.MasterMillsBulkService = MasterMillsBulkService;
exports.MasterMillsBulkService = MasterMillsBulkService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [excel_parser_service_1.ExcelParserService,
        master_mills_service_1.MasterMillsService,
        redis_service_1.RedisService,
        prisma_service_1.PrismaService])
], MasterMillsBulkService);
//# sourceMappingURL=master-mills-bulk.service.js.map