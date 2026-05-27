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
exports.MaterialsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const redis_service_1 = require("../../redis/redis.service");
let MaterialsService = class MaterialsService {
    prisma;
    redis;
    CACHE_PREFIX = 'material:';
    LIST_CACHE_KEY = 'materials:list:';
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
        const [materials, total] = await Promise.all([
            this.prisma.material.findMany({
                skip,
                take,
                where: { ...where, deleted_at: null },
                orderBy,
            }),
            this.prisma.material.count({ where: { ...where, deleted_at: null } }),
        ]);
        const result = { materials, total };
        await this.redis.setJson(cacheKey, result, 300);
        return result;
    }
    async findById(id) {
        const cacheKey = `${this.CACHE_PREFIX}id:${id}`;
        const cached = await this.redis.getJson(cacheKey);
        if (cached)
            return cached;
        const material = await this.prisma.material.findFirst({
            where: { id, deleted_at: null },
        });
        if (material)
            await this.redis.setJson(cacheKey, material, 3600);
        return material;
    }
    async create(dto) {
        const material = await this.prisma.material.create({
            data: dto,
        });
        await this.invalidateCache();
        return material;
    }
    async update(id, dto) {
        const existing = await this.prisma.material.findFirst({
            where: { id, deleted_at: null },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Material not found');
        }
        const material = await this.prisma.material.update({
            where: { id },
            data: dto,
        });
        await this.invalidateCache(id);
        return material;
    }
    async remove(id) {
        const existing = await this.prisma.material.findFirst({
            where: { id, deleted_at: null },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Material not found');
        }
        const material = await this.prisma.material.update({
            where: { id },
            data: { deleted_at: new Date(), status: 'DELETED' },
        });
        await this.invalidateCache(id);
        return material;
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
exports.MaterialsService = MaterialsService;
exports.MaterialsService = MaterialsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], MaterialsService);
//# sourceMappingURL=materials.service.js.map