"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const redis_service_1 = require("../../redis/redis.service");
const bcrypt = __importStar(require("bcrypt"));
const s3_service_1 = require("../../shared/services/s3.service");
let UsersService = class UsersService {
    prisma;
    redis;
    s3Service;
    CACHE_PREFIX = 'user:';
    LIST_CACHE_KEY = 'users:list:';
    constructor(prisma, redis, s3Service) {
        this.prisma = prisma;
        this.redis = redis;
        this.s3Service = s3Service;
    }
    async findAll(params) {
        const { skip, take, where, orderBy } = params;
        const cacheKey = `${this.LIST_CACHE_KEY}${JSON.stringify(params)}`;
        const cachedData = await this.redis.getJson(cacheKey);
        if (cachedData)
            return cachedData;
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                skip,
                take,
                where: { ...where, deleted_at: null },
                orderBy,
                include: { role: true },
            }),
            this.prisma.user.count({ where: { ...where, deleted_at: null } }),
        ]);
        const result = {
            users: users.map((u) => this.formatUser(u)),
            total,
        };
        await this.redis.setJson(cacheKey, result, 300);
        return result;
    }
    async findByEmail(email) {
        const cacheKey = `${this.CACHE_PREFIX}email:${email}`;
        const cached = await this.redis.getJson(cacheKey);
        if (cached)
            return cached;
        const user = await this.prisma.user.findUnique({
            where: { email },
            include: {
                role: { include: { permissions: { include: { permission: true } } } },
            },
        });
        const formattedUser = user ? this.formatUser(user) : null;
        if (formattedUser)
            await this.redis.setJson(cacheKey, formattedUser, 300);
        return formattedUser;
    }
    async findById(id) {
        const cacheKey = `${this.CACHE_PREFIX}id:${id}`;
        const cached = await this.redis.getJson(cacheKey);
        if (cached)
            return cached;
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: {
                role: { include: { permissions: { include: { permission: true } } } },
            },
        });
        const formattedUser = user ? this.formatUser(user) : null;
        if (formattedUser)
            await this.redis.setJson(cacheKey, formattedUser, 300);
        return formattedUser;
    }
    async create(dto) {
        const { password, ...data } = dto;
        if (data.phone_number === '') {
            data.phone_number = null;
        }
        const existingUser = await this.prisma.user.findUnique({
            where: { email: data.email },
        });
        if (existingUser) {
            throw new common_1.ConflictException('User with this email already exists');
        }
        const password_hash = await bcrypt.hash(password, 10);
        const user = await this.prisma.user.create({
            data: {
                ...data,
                password_hash,
            },
            include: { role: true },
        });
        if (user.role?.name === 'Service Engineer') {
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
            await this.redis.delByPrefix('technicians:list:');
            await this.redis.del(`technician:id:${user.id}`);
        }
        const imageAclPromises = [];
        if (user.profile_image) {
            imageAclPromises.push(this.s3Service.makeObjectPublic(user.profile_image));
        }
        if (user.background_image) {
            imageAclPromises.push(this.s3Service.makeObjectPublic(user.background_image));
        }
        if (imageAclPromises.length > 0) {
            await Promise.all(imageAclPromises);
        }
        await this.invalidateCache(user.id, user.email);
        return this.formatUser(user);
    }
    async update(id, dto, requestingUser) {
        const existingUser = await this.prisma.user.findUnique({
            where: { id },
            include: { role: true },
        });
        if (!existingUser) {
            throw new common_1.NotFoundException('User not found');
        }
        const { password, ...data } = dto;
        const hasUpdatePermission = requestingUser?.permissions?.includes('users.update');
        const isSelfUpdate = requestingUser?.userId === id;
        if (isSelfUpdate && !hasUpdatePermission) {
            delete data.role_id;
            delete data.account_status;
        }
        if (data.email) {
            const emailConflict = await this.prisma.user.findUnique({
                where: { email: data.email },
            });
            if (emailConflict && emailConflict.id !== id) {
                throw new common_1.ConflictException('User with this email already exists');
            }
        }
        const updateData = { ...data };
        if (updateData.phone_number === '') {
            updateData.phone_number = null;
        }
        if (password) {
            updateData.password_hash = await bcrypt.hash(password, 10);
        }
        const user = await this.prisma.user.update({
            where: { id },
            data: updateData,
            include: { role: true },
        });
        if (user.role?.name === 'Service Engineer') {
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
            await this.redis.delByPrefix('technicians:list:');
            await this.redis.del(`technician:id:${user.id}`);
        }
        else {
            await this.prisma.technician.updateMany({
                where: { id: user.id, deleted_at: null },
                data: {
                    deleted_at: new Date(),
                    status: 'INACTIVE',
                },
            });
            await this.redis.delByPrefix('technicians:list:');
            await this.redis.del(`technician:id:${user.id}`);
        }
        const imageAclPromises = [];
        if (user.profile_image && user.profile_image !== existingUser.profile_image) {
            imageAclPromises.push(this.s3Service.makeObjectPublic(user.profile_image));
        }
        if (user.background_image && user.background_image !== existingUser.background_image) {
            imageAclPromises.push(this.s3Service.makeObjectPublic(user.background_image));
        }
        if (imageAclPromises.length > 0) {
            await Promise.all(imageAclPromises);
        }
        await this.invalidateCache(id, user.email);
        return {
            before: existingUser ? this.formatUser(existingUser) : null,
            after: this.formatUser(user),
        };
    }
    async remove(id) {
        const user = await this.prisma.user.update({
            where: { id },
            data: { deleted_at: new Date(), account_status: 'DELETED' },
        });
        await this.prisma.technician.updateMany({
            where: { id, deleted_at: null },
            data: {
                deleted_at: new Date(),
                status: 'INACTIVE',
            },
        });
        await this.redis.delByPrefix('technicians:list:');
        await this.redis.del(`technician:id:${id}`);
        await this.invalidateCache(id, user.email);
        return user;
    }
    async getRoles() {
        const cacheKey = 'users:roles';
        const cached = await this.redis.getJson(cacheKey);
        if (cached)
            return cached;
        const roles = await this.prisma.role.findMany();
        await this.redis.setJson(cacheKey, roles, 3600);
        return roles;
    }
    async invalidateCache(id, email) {
        const promises = [
            this.redis.delByPrefix(this.LIST_CACHE_KEY),
        ];
        if (id)
            promises.push(this.redis.del(`${this.CACHE_PREFIX}id:${id}`));
        if (email)
            promises.push(this.redis.del(`${this.CACHE_PREFIX}email:${email}`));
        promises.push(this.redis.del('users:roles'));
        await Promise.all(promises);
    }
    formatUser(user) {
        if (!user)
            return null;
        return {
            ...user,
            profile_image_url: user.profile_image
                ? this.s3Service.getFileUrl(user.profile_image)
                : null,
            background_image_url: user.background_image
                ? this.s3Service.getFileUrl(user.background_image)
                : null,
        };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        s3_service_1.S3Service])
], UsersService);
//# sourceMappingURL=users.service.js.map