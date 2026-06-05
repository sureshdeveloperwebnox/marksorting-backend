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
exports.StoresService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const redis_service_1 = require("../../redis/redis.service");
let StoresService = class StoresService {
    prisma;
    redis;
    CACHE_PREFIX = 'store:';
    LIST_CACHE_KEY = 'stores:list:';
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
        const [stores, total] = await Promise.all([
            this.prisma.store.findMany({
                skip,
                take,
                where: { ...where, deleted_at: null },
                include: {
                    service_engineer: { select: { id: true, full_name: true } },
                    customer: { select: { id: true, name: true } },
                    materials: {
                        include: {
                            material: { select: { id: true, name: true } },
                        },
                    },
                },
                orderBy,
            }),
            this.prisma.store.count({ where: { ...where, deleted_at: null } }),
        ]);
        const result = { stores, total };
        await this.redis.setJson(cacheKey, result, 300);
        return result;
    }
    async findById(id) {
        const cacheKey = `${this.CACHE_PREFIX}id:${id}`;
        const cached = await this.redis.getJson(cacheKey);
        if (cached)
            return cached;
        const store = await this.prisma.store.findFirst({
            where: { id, deleted_at: null },
            include: {
                service_engineer: { select: { id: true, full_name: true } },
                customer: { select: { id: true, name: true } },
                materials: {
                    include: {
                        material: { select: { id: true, name: true } },
                    },
                },
            },
        });
        if (store)
            await this.redis.setJson(cacheKey, store, 3600);
        return store;
    }
    async create(dto) {
        const { material_ids, ...data } = dto;
        const existingFrame = await this.prisma.store.findFirst({
            where: { frame_number: data.frame_number },
        });
        if (existingFrame) {
            throw new common_1.ConflictException('Frame number already exists');
        }
        const store = await this.prisma.store.create({
            data: {
                ...data,
                materials: {
                    create: material_ids.map((id) => ({
                        material: { connect: { id } },
                    })),
                },
            },
            include: {
                service_engineer: { select: { id: true, full_name: true } },
                customer: { select: { id: true, name: true } },
                materials: {
                    include: {
                        material: { select: { id: true, name: true } },
                    },
                },
            },
        });
        await this.invalidateCache();
        return store;
    }
    async update(id, dto) {
        const existing = await this.prisma.store.findFirst({
            where: { id, deleted_at: null },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Store record not found');
        }
        const { material_ids, ...data } = dto;
        if (data.frame_number) {
            const existingFrame = await this.prisma.store.findFirst({
                where: {
                    frame_number: data.frame_number,
                    id: { not: id },
                },
            });
            if (existingFrame) {
                throw new common_1.ConflictException('Frame number already exists');
            }
        }
        const store = await this.prisma.store.update({
            where: { id },
            data: {
                ...data,
                materials: material_ids
                    ? {
                        deleteMany: {},
                        create: material_ids.map((matId) => ({
                            material: { connect: { id: matId } },
                        })),
                    }
                    : undefined,
            },
            include: {
                service_engineer: { select: { id: true, full_name: true } },
                customer: { select: { id: true, name: true } },
                materials: {
                    include: {
                        material: { select: { id: true, name: true } },
                    },
                },
            },
        });
        await this.invalidateCache(id);
        return { before: existing, after: store };
    }
    async remove(id) {
        const existing = await this.prisma.store.findFirst({
            where: { id, deleted_at: null },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Store record not found');
        }
        const store = await this.prisma.store.update({
            where: { id },
            data: { deleted_at: new Date() },
        });
        await this.invalidateCache(id);
        return store;
    }
    async findByTechnician(technicianId, params) {
        const { skip, take, search, return_status, inflow_status, warranty_status } = params;
        const where = {
            service_engineer_id: technicianId,
            deleted_at: null,
        };
        if (return_status) {
            where.return_status = return_status;
        }
        if (inflow_status) {
            where.inflow_status = inflow_status;
        }
        if (warranty_status) {
            where.warranty_status = warranty_status;
        }
        if (search) {
            where.OR = [
                { frame_number: { contains: search, mode: 'insensitive' } },
                { barcode: { contains: search, mode: 'insensitive' } },
                {
                    customer: {
                        name: { contains: search, mode: 'insensitive' },
                    },
                },
            ];
        }
        const [stores, total] = await Promise.all([
            this.prisma.store.findMany({
                skip,
                take,
                where,
                include: {
                    service_engineer: { select: { id: true, full_name: true } },
                    customer: { select: { id: true, name: true } },
                    materials: {
                        include: {
                            material: { select: { id: true, name: true } },
                        },
                    },
                },
                orderBy: { created_at: 'desc' },
            }),
            this.prisma.store.count({ where }),
        ]);
        return { stores, total };
    }
    async findPendingByTechnician(technicianId, params) {
        const { skip, take, search } = params;
        const where = {
            service_engineer_id: technicianId,
            return_status: 'Pending',
            deleted_at: null,
        };
        if (search) {
            where.OR = [
                { frame_number: { contains: search, mode: 'insensitive' } },
                { barcode: { contains: search, mode: 'insensitive' } },
                {
                    customer: {
                        name: { contains: search, mode: 'insensitive' },
                    },
                },
            ];
        }
        const [stores, total] = await Promise.all([
            this.prisma.store.findMany({
                skip,
                take,
                where,
                include: {
                    service_engineer: { select: { id: true, full_name: true } },
                    customer: { select: { id: true, name: true } },
                    materials: {
                        include: {
                            material: { select: { id: true, name: true } },
                        },
                    },
                },
                orderBy: { created_at: 'desc' },
            }),
            this.prisma.store.count({ where }),
        ]);
        return { stores, total };
    }
    async submitReturnDetails(storeId, technicianId, dto) {
        const existing = await this.prisma.store.findFirst({
            where: { id: storeId, deleted_at: null },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Store record not found');
        }
        if (existing.service_engineer_id !== technicianId) {
            throw new common_1.ForbiddenException('You are not authorized to update this store record');
        }
        if (existing.return_status !== 'Pending') {
            throw new common_1.ConflictException(`Store return status is already ${existing.return_status}`);
        }
        const store = await this.prisma.store.update({
            where: { id: storeId },
            data: {
                provider_name: dto.provider_name,
                invoice_number: dto.invoice_number,
                return_status: 'Completed',
            },
            include: {
                service_engineer: { select: { id: true, full_name: true } },
                customer: { select: { id: true, name: true } },
                materials: {
                    include: {
                        material: { select: { id: true, name: true } },
                    },
                },
            },
        });
        await this.invalidateCache(storeId);
        return { before: existing, after: store };
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
exports.StoresService = StoresService;
exports.StoresService = StoresService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], StoresService);
//# sourceMappingURL=stores.service.js.map