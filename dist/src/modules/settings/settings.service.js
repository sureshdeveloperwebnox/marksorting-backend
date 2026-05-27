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
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const redis_service_1 = require("../../redis/redis.service");
let SettingsService = class SettingsService {
    prisma;
    redis;
    CACHE_PREFIX = 'setting:';
    LIST_CACHE_KEY = 'settings:list:';
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
    }
    async findAll(params) {
        const cacheKey = `${this.LIST_CACHE_KEY}${JSON.stringify(params)}`;
        const cachedData = await this.redis.getJson(cacheKey);
        if (cachedData)
            return cachedData;
        const { skip, take, search, group } = params;
        const where = {};
        if (search) {
            where.OR = [
                { key: { contains: search, mode: 'insensitive' } },
                { value: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (group) {
            where.group = group;
        }
        const [settings, total] = await Promise.all([
            this.prisma.setting.findMany({
                skip,
                take,
                where,
                orderBy: { created_at: 'desc' },
            }),
            this.prisma.setting.count({ where }),
        ]);
        const result = { settings, total };
        await this.redis.setJson(cacheKey, result, 300);
        return result;
    }
    async findById(id) {
        const cacheKey = `${this.CACHE_PREFIX}id:${id}`;
        const cached = await this.redis.getJson(cacheKey);
        if (cached)
            return cached;
        const setting = await this.prisma.setting.findUnique({
            where: { id },
        });
        if (!setting) {
            throw new common_1.NotFoundException(`Setting with ID "${id}" not found`);
        }
        await this.redis.setJson(cacheKey, setting, 3600);
        return setting;
    }
    async create(dto) {
        const existing = await this.prisma.setting.findUnique({
            where: { key: dto.key },
        });
        if (existing) {
            throw new common_1.BadRequestException(`Setting with key "${dto.key}" already exists`);
        }
        const setting = await this.prisma.setting.create({
            data: dto,
        });
        await this.invalidateCache();
        return setting;
    }
    async update(id, dto) {
        await this.findById(id);
        if (dto.key) {
            const existing = await this.prisma.setting.findFirst({
                where: { key: dto.key, id: { not: id } },
            });
            if (existing) {
                throw new common_1.BadRequestException(`Setting with key "${dto.key}" already exists`);
            }
        }
        const setting = await this.prisma.setting.update({
            where: { id },
            data: dto,
        });
        await this.invalidateCache(id);
        return setting;
    }
    async remove(id) {
        await this.findById(id);
        const setting = await this.prisma.setting.delete({
            where: { id },
        });
        await this.invalidateCache(id);
        return setting;
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
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], SettingsService);
//# sourceMappingURL=settings.service.js.map