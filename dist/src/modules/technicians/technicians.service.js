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
exports.TechniciansService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const redis_service_1 = require("../../redis/redis.service");
let TechniciansService = class TechniciansService {
    prisma;
    redis;
    CACHE_PREFIX = 'technician:';
    LIST_CACHE_KEY = 'technicians:list:';
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
    }
    async onApplicationBootstrap() {
        console.log('Synchronizing technicians on application bootstrap...');
        await this.syncTechnicians();
    }
    async syncTechnicians() {
        try {
            const role = await this.prisma.role.findUnique({
                where: { name: 'Service Engineer' },
            });
            if (!role) {
                return;
            }
            const users = await this.prisma.user.findMany({
                where: {
                    role_id: role.id,
                    deleted_at: null,
                    account_status: 'ACTIVE',
                },
            });
            const activeUserIds = users.map((user) => user.id);
            for (const user of users) {
                await this.prisma.technician.upsert({
                    where: { id: user.id },
                    update: {
                        full_name: user.full_name,
                        email: user.email,
                        phone: user.phone_number,
                    },
                    create: {
                        id: user.id,
                        full_name: user.full_name,
                        email: user.email,
                        phone: user.phone_number,
                        status: 'AVAILABLE',
                    },
                });
            }
            await this.prisma.technician.updateMany({
                where: {
                    id: { notIn: activeUserIds },
                    deleted_at: null,
                },
                data: {
                    deleted_at: new Date(),
                    status: 'INACTIVE',
                },
            });
        }
        catch (error) {
            console.error('Error syncing technicians:', error);
        }
    }
    async findAll(params) {
        const cacheKey = `${this.LIST_CACHE_KEY}${JSON.stringify(params)}`;
        const cachedData = await this.redis.getJson(cacheKey);
        if (cachedData)
            return cachedData;
        const activeCount = await this.prisma.technician.count({
            where: { deleted_at: null },
        });
        if (activeCount === 0) {
            await this.syncTechnicians();
        }
        else {
            this.syncTechnicians().catch((error) => {
                console.error('Background technician sync failed:', error);
            });
        }
        const { skip, take, where, orderBy } = params;
        const [technicians, total] = await Promise.all([
            this.prisma.technician.findMany({
                skip,
                take,
                where: { ...where, deleted_at: null },
                orderBy,
            }),
            this.prisma.technician.count({
                where: { ...where, deleted_at: null },
            }),
        ]);
        const result = { technicians, total };
        await this.redis.setJson(cacheKey, result, 300);
        return result;
    }
    async findById(id) {
        const cacheKey = `${this.CACHE_PREFIX}id:${id}`;
        const cached = await this.redis.getJson(cacheKey);
        if (cached)
            return cached;
        const technician = await this.prisma.technician.findFirst({
            where: { id, deleted_at: null },
        });
        if (!technician) {
            throw new common_1.NotFoundException('Technician not found');
        }
        await this.redis.setJson(cacheKey, technician, 3600);
        return technician;
    }
    async updateStatus(id, status) {
        const existing = await this.prisma.technician.findFirst({
            where: { id, deleted_at: null },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Technician not found');
        }
        const technician = await this.prisma.technician.update({
            where: { id },
            data: { status },
        });
        await this.invalidateCache(id);
        return technician;
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
exports.TechniciansService = TechniciansService;
exports.TechniciansService = TechniciansService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], TechniciansService);
//# sourceMappingURL=technicians.service.js.map