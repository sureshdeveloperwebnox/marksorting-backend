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
exports.MasterMillsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const redis_service_1 = require("../../redis/redis.service");
let MasterMillsService = class MasterMillsService {
    prisma;
    redis;
    CACHE_PREFIX = 'master_mill:';
    LIST_CACHE_KEY = 'master_mills:list:';
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
    }
    async findAll(params) {
        const { skip, take, where, orderBy } = params;
        const cacheKey = `${this.LIST_CACHE_KEY}${JSON.stringify(params)}`;
        const cachedData = await this.redis.getJson(cacheKey);
        if (cachedData)
            return cachedData;
        const [masterMills, total] = await Promise.all([
            this.prisma.masterMill.findMany({
                skip,
                take,
                where: { ...where, deleted_at: null },
                include: {
                    mill: { select: { id: true, name: true } },
                },
                orderBy,
            }),
            this.prisma.masterMill.count({ where: { ...where, deleted_at: null } }),
        ]);
        const result = { masterMills, total };
        await this.redis.setJson(cacheKey, result, 300);
        return result;
    }
    async findById(id) {
        const cacheKey = `${this.CACHE_PREFIX}id:${id}`;
        const cached = await this.redis.getJson(cacheKey);
        if (cached)
            return cached;
        const masterMill = await this.prisma.masterMill.findFirst({
            where: { id, deleted_at: null },
            include: {
                mill: { select: { id: true, name: true } },
            },
        });
        if (!masterMill)
            throw new common_1.NotFoundException('Master Mill record not found');
        await this.redis.setJson(cacheKey, masterMill, 3600);
        return masterMill;
    }
    async create(dto) {
        const data = { ...dto };
        if (!data.warranty_closing_date && data.installation_date) {
            const installDate = new Date(data.installation_date);
            const years = data.warranty_years ?? 0;
            const months = data.warranty_months ?? 0;
            installDate.setFullYear(installDate.getFullYear() + years);
            installDate.setMonth(installDate.getMonth() + months);
            data.warranty_closing_date = installDate.toISOString();
        }
        if (!data.amc_closing_date && data.amc_starting_date && data.amc_period) {
            const amcStart = new Date(data.amc_starting_date);
            amcStart.setMonth(amcStart.getMonth() + data.amc_period);
            data.amc_closing_date = amcStart.toISOString();
        }
        if (data.invoice_date)
            data.invoice_date = new Date(data.invoice_date);
        if (data.installation_date)
            data.installation_date = new Date(data.installation_date);
        if (data.warranty_closing_date)
            data.warranty_closing_date = new Date(data.warranty_closing_date);
        if (data.amc_starting_date)
            data.amc_starting_date = new Date(data.amc_starting_date);
        if (data.amc_closing_date)
            data.amc_closing_date = new Date(data.amc_closing_date);
        const masterMill = await this.prisma.masterMill.create({ data });
        await this.invalidateCache();
        return masterMill;
    }
    async update(id, dto) {
        const existing = await this.prisma.masterMill.findFirst({
            where: { id, deleted_at: null },
        });
        if (!existing)
            throw new common_1.NotFoundException('Master Mill record not found');
        const data = { ...dto };
        const installDate = data.installation_date
            ? new Date(data.installation_date)
            : existing.installation_date
                ? new Date(existing.installation_date)
                : null;
        if (installDate && !data.warranty_closing_date) {
            const years = data.warranty_years ?? existing.warranty_years ?? 0;
            const months = data.warranty_months ?? existing.warranty_months ?? 0;
            const closing = new Date(installDate);
            closing.setFullYear(closing.getFullYear() + years);
            closing.setMonth(closing.getMonth() + months);
            data.warranty_closing_date = closing.toISOString();
        }
        const amcStart = data.amc_starting_date
            ? new Date(data.amc_starting_date)
            : existing.amc_starting_date
                ? new Date(existing.amc_starting_date)
                : null;
        const amcPeriod = data.amc_period ?? existing.amc_period;
        if (amcStart && amcPeriod && !data.amc_closing_date) {
            const amcClose = new Date(amcStart);
            amcClose.setMonth(amcClose.getMonth() + amcPeriod);
            data.amc_closing_date = amcClose.toISOString();
        }
        if (data.invoice_date)
            data.invoice_date = new Date(data.invoice_date);
        if (data.installation_date)
            data.installation_date = new Date(data.installation_date);
        if (data.warranty_closing_date)
            data.warranty_closing_date = new Date(data.warranty_closing_date);
        if (data.amc_starting_date)
            data.amc_starting_date = new Date(data.amc_starting_date);
        if (data.amc_closing_date)
            data.amc_closing_date = new Date(data.amc_closing_date);
        const updated = await this.prisma.masterMill.update({
            where: { id },
            data,
        });
        await this.invalidateCache(id);
        return { before: existing, after: updated };
    }
    async remove(id) {
        const existing = await this.prisma.masterMill.findFirst({
            where: { id, deleted_at: null },
        });
        if (!existing)
            throw new common_1.NotFoundException('Master Mill record not found');
        const deleted = await this.prisma.masterMill.update({
            where: { id },
            data: { deleted_at: new Date(), status: 'DELETED' },
        });
        await this.invalidateCache(id);
        return deleted;
    }
    async getStats() {
        const cacheKey = `${this.LIST_CACHE_KEY}stats`;
        const cached = await this.redis.getJson(cacheKey);
        if (cached)
            return cached;
        const now = new Date();
        const [total, underWarranty, underAmc, nonWarranty, installationCount, serviceCount] = await Promise.all([
            this.prisma.masterMill.count({ where: { deleted_at: null } }),
            this.prisma.masterMill.count({
                where: {
                    deleted_at: null,
                    warranty_closing_date: { gte: now },
                    all_warranty: { not: 'Non Warranty' },
                },
            }),
            this.prisma.masterMill.count({
                where: {
                    deleted_at: null,
                    amc_closing_date: { gte: now },
                    amc_starting_date: { not: null },
                },
            }),
            this.prisma.masterMill.count({
                where: { deleted_at: null, all_warranty: 'Non Warranty' },
            }),
            this.prisma.masterMill.count({
                where: { deleted_at: null, type: 'Installation' },
            }),
            this.prisma.masterMill.count({
                where: { deleted_at: null, type: 'Service' },
            }),
        ]);
        const result = { total, underWarranty, underAmc, nonWarranty, installationCount, serviceCount };
        await this.redis.setJson(cacheKey, result, 120);
        return result;
    }
    async invalidateCache(id) {
        const promises = [
            this.redis.delByPrefix(this.LIST_CACHE_KEY),
        ];
        if (id) {
            promises.push(this.redis.del(`${this.CACHE_PREFIX}id:${id}`));
        }
        await Promise.all(promises);
    }
};
exports.MasterMillsService = MasterMillsService;
exports.MasterMillsService = MasterMillsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], MasterMillsService);
//# sourceMappingURL=master-mills.service.js.map