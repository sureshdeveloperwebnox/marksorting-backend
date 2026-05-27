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
exports.RolesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const redis_service_1 = require("../../redis/redis.service");
let RolesService = class RolesService {
    prisma;
    redis;
    CACHE_PREFIX = 'role:';
    LIST_CACHE_KEY = 'roles:list:';
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
        const [roles, total] = await Promise.all([
            this.prisma.role.findMany({
                skip,
                take,
                where,
                orderBy,
                include: {
                    _count: {
                        select: { users: true },
                    },
                },
            }),
            this.prisma.role.count({ where }),
        ]);
        const result = { roles, total };
        await this.redis.setJson(cacheKey, result, 300);
        return result;
    }
    async findById(id) {
        const cacheKey = `${this.CACHE_PREFIX}id:${id}`;
        const cached = await this.redis.getJson(cacheKey);
        if (cached)
            return cached;
        const role = await this.prisma.role.findUnique({
            where: { id },
            include: {
                permissions: {
                    include: { permission: true },
                },
                _count: {
                    select: { users: true },
                },
            },
        });
        if (!role)
            throw new common_1.NotFoundException('Role not found');
        const formattedRole = this.formatRole(role);
        await this.redis.setJson(cacheKey, formattedRole, 3600);
        return formattedRole;
    }
    async create(dto) {
        const existingRole = await this.prisma.role.findUnique({
            where: { name: dto.name },
        });
        if (existingRole) {
            throw new common_1.ConflictException('Role with this name already exists');
        }
        const role = await this.prisma.role.create({
            data: {
                name: dto.name,
                description: dto.description,
                ...(dto.permission_ids &&
                    dto.permission_ids.length > 0 && {
                    permissions: {
                        create: dto.permission_ids.map((permissionId) => ({
                            permission: { connect: { id: permissionId } },
                        })),
                    },
                }),
            },
            include: {
                _count: {
                    select: { users: true },
                },
            },
        });
        await this.invalidateCache();
        return this.formatRole(role);
    }
    async update(id, dto) {
        const existingRole = await this.prisma.role.findUnique({ where: { id } });
        if (!existingRole)
            throw new common_1.NotFoundException('Role not found');
        if (dto.name && dto.name !== existingRole.name) {
            const duplicate = await this.prisma.role.findUnique({
                where: { name: dto.name },
            });
            if (duplicate)
                throw new common_1.ConflictException('Role with this name already exists');
        }
        const updateData = {};
        if (dto.name)
            updateData.name = dto.name;
        if (dto.description !== undefined)
            updateData.description = dto.description;
        const role = await this.prisma.role.update({
            where: { id },
            data: updateData,
            include: {
                _count: {
                    select: { users: true },
                },
            },
        });
        await this.invalidateCache(id);
        return this.formatRole(role);
    }
    async remove(id) {
        const existingRole = await this.prisma.role.findUnique({ where: { id } });
        if (!existingRole)
            throw new common_1.NotFoundException('Role not found');
        const userCount = await this.prisma.user.count({ where: { role_id: id } });
        if (userCount > 0) {
            throw new common_1.ConflictException('Cannot delete role that has assigned users');
        }
        await this.prisma.rolePermission.deleteMany({ where: { role_id: id } });
        await this.prisma.role.delete({ where: { id } });
        await this.invalidateCache(id);
        return { message: 'Role deleted successfully' };
    }
    async invalidateCache(id) {
        const promises = [
            this.redis.delByPrefix(this.LIST_CACHE_KEY),
        ];
        if (id)
            promises.push(this.redis.del(`${this.CACHE_PREFIX}id:${id}`));
        await Promise.all(promises);
    }
    formatRole(role) {
        if (!role)
            return null;
        return {
            ...role,
            permissions: role.permissions?.map((rp) => rp.permission) || [],
        };
    }
};
exports.RolesService = RolesService;
exports.RolesService = RolesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], RolesService);
//# sourceMappingURL=roles.service.js.map