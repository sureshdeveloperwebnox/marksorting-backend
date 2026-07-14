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
exports.ServiceCategoriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const redis_service_1 = require("../../redis/redis.service");
let ServiceCategoriesService = class ServiceCategoriesService {
    prisma;
    redis;
    CACHE_PREFIX = 'service-category:';
    LIST_CACHE_KEY = 'service-categories:list:';
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
    }
    async findAll(params) {
        const cacheKey = `${this.LIST_CACHE_KEY}${JSON.stringify(params)}`;
        const cachedData = await this.redis.getJson(cacheKey);
        if (cachedData)
            return cachedData;
        const { skip, take, search, status } = params;
        const where = { deleted_at: null };
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (status) {
            where.status = status;
        }
        const [serviceCategories, total] = await Promise.all([
            this.prisma.serviceCategory.findMany({ skip, take, where }),
            this.prisma.serviceCategory.count({ where }),
        ]);
        const result = { serviceCategories, total };
        await this.redis.setJson(cacheKey, result, 300);
        return result;
    }
    async findById(id) {
        const cacheKey = `${this.CACHE_PREFIX}id:${id}`;
        const cached = await this.redis.getJson(cacheKey);
        if (cached)
            return cached;
        const serviceCategory = await this.prisma.serviceCategory.findFirst({
            where: { id, deleted_at: null },
        });
        if (!serviceCategory) {
            throw new common_1.NotFoundException(`Service category with ID "${id}" not found`);
        }
        await this.redis.setJson(cacheKey, serviceCategory, 3600);
        return serviceCategory;
    }
    async create(dto) {
        const serviceCategory = await this.prisma.serviceCategory.create({
            data: dto,
        });
        await this.invalidateCache();
        return serviceCategory;
    }
    async update(id, dto) {
        const existing = await this.findById(id);
        const serviceCategory = await this.prisma.serviceCategory.update({
            where: { id },
            data: dto,
        });
        await this.invalidateCache(id);
        return { before: existing, after: serviceCategory };
    }
    async remove(id) {
        await this.findById(id);
        const serviceCategory = await this.prisma.serviceCategory.update({
            where: { id },
            data: { deleted_at: new Date() },
        });
        await this.invalidateCache(id);
        return serviceCategory;
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
exports.ServiceCategoriesService = ServiceCategoriesService;
exports.ServiceCategoriesService = ServiceCategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], ServiceCategoriesService);
//# sourceMappingURL=service-categories.service.js.map