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
exports.InstallationReportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const redis_service_1 = require("../../redis/redis.service");
const INCLUDE_SHAPE = {
    mill: { select: { id: true, name: true } },
    technicians: { include: { technician: { select: { id: true, full_name: true } } } },
};
let InstallationReportsService = class InstallationReportsService {
    prisma;
    redis;
    CACHE_PREFIX = 'installation-report:';
    LIST_CACHE_KEY = 'installation-reports:list:';
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
    }
    async findAll(params) {
        const cacheKey = `${this.LIST_CACHE_KEY}${JSON.stringify(params)}`;
        const cachedData = await this.redis.getJson(cacheKey);
        if (cachedData)
            return cachedData;
        const { skip, take, search, status, dateFrom, dateTo } = params;
        const where = { deleted_at: null };
        if (search) {
            where.OR = [
                { report_number: { contains: search, mode: 'insensitive' } },
                { place: { contains: search, mode: 'insensitive' } },
                { machine_model: { contains: search, mode: 'insensitive' } },
                { serial_or_frame_no: { contains: search, mode: 'insensitive' } },
                { authorized_person: { contains: search, mode: 'insensitive' } },
                { mill: { name: { contains: search, mode: 'insensitive' } } },
            ];
        }
        if (status) {
            where.status = status;
        }
        if (dateFrom || dateTo) {
            where.visit_date = {};
            if (dateFrom) {
                where.visit_date.gte = new Date(dateFrom);
            }
            if (dateTo) {
                where.visit_date.lte = new Date(dateTo);
            }
        }
        const [installationReports, total] = await Promise.all([
            this.prisma.installationReport.findMany({
                skip,
                take,
                where,
                include: INCLUDE_SHAPE,
                orderBy: { created_at: 'desc' },
            }),
            this.prisma.installationReport.count({ where }),
        ]);
        const result = { installationReports, total };
        await this.redis.setJson(cacheKey, result, 300);
        return result;
    }
    async findById(id) {
        const cacheKey = `${this.CACHE_PREFIX}id:${id}`;
        const cached = await this.redis.getJson(cacheKey);
        if (cached)
            return cached;
        const installationReport = await this.prisma.installationReport.findFirst({
            where: { id, deleted_at: null },
            include: INCLUDE_SHAPE,
        });
        if (!installationReport) {
            throw new common_1.NotFoundException(`Installation report with ID "${id}" not found`);
        }
        await this.redis.setJson(cacheKey, installationReport, 3600);
        return installationReport;
    }
    async create(dto) {
        const { technician_ids, ...reportData } = dto;
        const installationReport = await this.prisma.$transaction(async (tx) => {
            const todayStart = new Date();
            todayStart.setUTCHours(0, 0, 0, 0);
            const todayEnd = new Date();
            todayEnd.setUTCHours(23, 59, 59, 999);
            const count = await tx.installationReport.count({
                where: { created_at: { gte: todayStart, lte: todayEnd } },
            });
            const dateStr = todayStart.toISOString().slice(0, 10).replace(/-/g, '');
            const seq = String(count + 1);
            const report_number = `IR-${dateStr}-${seq}`;
            const created = await tx.installationReport.create({
                data: {
                    ...reportData,
                    report_number,
                    visit_date: new Date(reportData.visit_date),
                    call_registered_date: new Date(reportData.call_registered_date),
                    invoice_date: reportData.invoice_date
                        ? new Date(reportData.invoice_date)
                        : undefined,
                    warranty_start_date: reportData.warranty_start_date
                        ? new Date(reportData.warranty_start_date)
                        : undefined,
                    warranty_end_date: reportData.warranty_end_date
                        ? new Date(reportData.warranty_end_date)
                        : undefined,
                },
                include: INCLUDE_SHAPE,
            });
            await tx.installationReportTechnician.createMany({
                data: technician_ids.map((tid) => ({
                    installation_report_id: created.id,
                    technician_id: tid,
                })),
            });
            return tx.installationReport.findFirst({
                where: { id: created.id },
                include: INCLUDE_SHAPE,
            });
        });
        await this.invalidateCache();
        return installationReport;
    }
    async update(id, dto) {
        await this.findById(id);
        const { technician_ids, ...reportData } = dto;
        const updateData = { ...reportData };
        if (reportData.visit_date !== undefined) {
            updateData.visit_date = new Date(reportData.visit_date);
        }
        if (reportData.call_registered_date !== undefined) {
            updateData.call_registered_date = new Date(reportData.call_registered_date);
        }
        if (reportData.invoice_date !== undefined) {
            updateData.invoice_date = reportData.invoice_date
                ? new Date(reportData.invoice_date)
                : null;
        }
        if (reportData.warranty_start_date !== undefined) {
            updateData.warranty_start_date = reportData.warranty_start_date
                ? new Date(reportData.warranty_start_date)
                : null;
        }
        if (reportData.warranty_end_date !== undefined) {
            updateData.warranty_end_date = reportData.warranty_end_date
                ? new Date(reportData.warranty_end_date)
                : null;
        }
        const installationReport = await this.prisma.installationReport.update({
            where: { id },
            data: updateData,
            include: INCLUDE_SHAPE,
        });
        if (technician_ids !== undefined) {
            await this.prisma.installationReportTechnician.deleteMany({
                where: { installation_report_id: id },
            });
            await this.prisma.installationReportTechnician.createMany({
                data: technician_ids.map((tid) => ({
                    installation_report_id: id,
                    technician_id: tid,
                })),
            });
        }
        await this.invalidateCache(id);
        return installationReport;
    }
    async remove(id) {
        await this.findById(id);
        const installationReport = await this.prisma.installationReport.update({
            where: { id },
            data: { deleted_at: new Date() },
            include: INCLUDE_SHAPE,
        });
        await this.invalidateCache(id);
        return installationReport;
    }
    async invalidateCache(id) {
        const promises = [this.redis.delByPrefix(this.LIST_CACHE_KEY)];
        if (id) {
            promises.push(this.redis.del(`${this.CACHE_PREFIX}id:${id}`));
        }
        await Promise.all(promises);
    }
};
exports.InstallationReportsService = InstallationReportsService;
exports.InstallationReportsService = InstallationReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], InstallationReportsService);
//# sourceMappingURL=installation-reports.service.js.map