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
exports.PermissionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const redis_service_1 = require("../../redis/redis.service");
let PermissionsService = class PermissionsService {
    prisma;
    redis;
    CACHE_PREFIX = 'user_permissions:';
    CACHE_TTL = 300;
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
    }
    async getUserPermissions(userId) {
        const cacheKey = `${this.CACHE_PREFIX}${userId}`;
        const cachedPermissions = await this.redis.getJson(cacheKey);
        if (cachedPermissions) {
            return cachedPermissions;
        }
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                role: {
                    include: {
                        permissions: {
                            include: {
                                permission: true,
                            },
                        },
                    },
                },
            },
        });
        if (!user) {
            return [];
        }
        const permissions = user.role.permissions.map((rp) => rp.permission.name);
        await this.redis.setJson(cacheKey, permissions, this.CACHE_TTL);
        return permissions;
    }
    async hasPermission(userId, permission) {
        const permissions = await this.getUserPermissions(userId);
        return permissions.includes(permission);
    }
    async hasAnyPermission(userId, permissions) {
        const userPermissions = await this.getUserPermissions(userId);
        return permissions.some((permission) => userPermissions.includes(permission));
    }
    async hasAllPermissions(userId, permissions) {
        const userPermissions = await this.getUserPermissions(userId);
        return permissions.every((permission) => userPermissions.includes(permission));
    }
    async invalidateUserPermissionsCache(userId) {
        const cacheKey = `${this.CACHE_PREFIX}${userId}`;
        await this.redis.del(cacheKey);
    }
    async getAllPermissions() {
        return this.prisma.permission.findMany({
            orderBy: { name: 'asc' },
        });
    }
    async getPermissionsByModule(module) {
        return this.prisma.permission.findMany({
            where: {
                name: {
                    startsWith: `${module}.`,
                },
            },
            orderBy: { name: 'asc' },
        });
    }
};
exports.PermissionsService = PermissionsService;
exports.PermissionsService = PermissionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], PermissionsService);
//# sourceMappingURL=permissions.service.js.map