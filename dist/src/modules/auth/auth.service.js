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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("crypto"));
const users_service_1 = require("../users/users.service");
const redis_service_1 = require("../../redis/redis.service");
const permissions_service_1 = require("../permissions/permissions.service");
const prisma_service_1 = require("../../prisma/prisma.service");
const mail_service_1 = require("../mail/mail.service");
let AuthService = class AuthService {
    usersService;
    jwtService;
    configService;
    redisService;
    permissionsService;
    prisma;
    mailService;
    constructor(usersService, jwtService, configService, redisService, permissionsService, prisma, mailService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.configService = configService;
        this.redisService = redisService;
        this.permissionsService = permissionsService;
        this.prisma = prisma;
        this.mailService = mailService;
    }
    async validateUser(email, pass) {
        const user = await this.usersService.findByEmail(email);
        if (user && (await bcrypt.compare(pass, user.password_hash))) {
            const { password_hash, ...result } = user;
            return result;
        }
        return null;
    }
    async validateServiceEngineer(email, pass) {
        const user = await this.usersService.findByEmail(email);
        if (user &&
            user.role?.name === 'Service Engineer' &&
            user.account_status === 'ACTIVE' &&
            !user.deleted_at &&
            (await bcrypt.compare(pass, user.password_hash))) {
            const { password_hash, ...result } = user;
            return result;
        }
        return null;
    }
    async register(registerDto) {
        const roles = await this.usersService.getRoles();
        const defaultRole = roles.find((r) => r.name === 'Super Admin') || roles[0];
        if (!defaultRole) {
            throw new common_1.UnauthorizedException('No default roles defined in the system');
        }
        const user = await this.usersService.create({
            full_name: registerDto.full_name,
            email: registerDto.email,
            password: registerDto.password,
            role_id: defaultRole.id,
            account_status: 'ACTIVE',
        });
        return this.login(user);
    }
    async login(user) {
        const permissions = await this.permissionsService.getUserPermissions(user.id);
        const payload = {
            email: user.email,
            sub: user.id,
            full_name: user.full_name,
            role: user.role.name,
            permissions: permissions
        };
        return {
            access_token: this.jwtService.sign(payload),
            refresh_token: await this.generateRefreshToken(user.id),
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role.name,
                permissions: permissions,
                profile_image: user.profile_image,
                profile_image_url: user.profile_image_url,
                background_image: user.background_image,
                background_image_url: user.background_image_url,
            },
        };
    }
    async mobileLogin(user) {
        const permissions = await this.permissionsService.getUserPermissions(user.id);
        const payload = {
            email: user.email,
            sub: user.id,
            full_name: user.full_name,
            role: user.role.name,
            permissions: permissions
        };
        return {
            access_token: this.jwtService.sign(payload),
            refresh_token: await this.generateRefreshToken(user.id),
        };
    }
    async getProfile(userId) {
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        const permissions = await this.permissionsService.getUserPermissions(userId);
        return {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            role: user.role?.name ?? user.role,
            permissions,
            profile_image: user.profile_image,
            profile_image_url: user.profile_image_url,
            background_image: user.background_image,
            background_image_url: user.background_image_url,
        };
    }
    async logout(userId) {
        await this.redisService.del(`refresh_token:${userId}`);
    }
    async updateProfile(userId, dto) {
        const { after: user } = await this.usersService.update(userId, dto);
        const permissions = await this.permissionsService.getUserPermissions(userId);
        return {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            role: user.role?.name ?? user.role,
            permissions,
            profile_image: user.profile_image,
            profile_image_url: user.profile_image_url,
            background_image: user.background_image,
            background_image_url: user.background_image_url,
        };
    }
    decodeToken(token) {
        return this.jwtService.decode(token);
    }
    async generateRefreshToken(userId) {
        const refreshToken = this.jwtService.sign({ sub: userId }, {
            secret: this.configService.get('jwt.refreshSecret'),
            expiresIn: this.configService.get('jwt.refreshExpiresIn'),
        });
        await this.redisService.set(`refresh_token:${userId}`, refreshToken, 'EX', 7 * 24 * 60 * 60);
        return refreshToken;
    }
    async refresh(refreshToken) {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get('jwt.refreshSecret'),
            });
            const userId = payload.sub;
            const storedToken = await this.redisService.get(`refresh_token:${userId}`);
            if (!storedToken || storedToken !== refreshToken) {
                throw new common_1.UnauthorizedException('Invalid refresh token');
            }
            const user = await this.usersService.findById(userId);
            if (!user) {
                throw new common_1.UnauthorizedException('User not found');
            }
            const permissions = await this.permissionsService.getUserPermissions(userId);
            const newRefreshToken = await this.generateRefreshToken(userId);
            const newPayload = {
                email: user.email,
                sub: user.id,
                full_name: user.full_name,
                role: user.role.name,
                permissions: permissions,
            };
            return {
                access_token: this.jwtService.sign(newPayload),
                refresh_token: newRefreshToken,
                user: {
                    id: user.id,
                    email: user.email,
                    full_name: user.full_name,
                    role: user.role.name,
                    permissions: permissions,
                    profile_image: user.profile_image,
                    profile_image_url: user.profile_image_url,
                    background_image: user.background_image,
                    background_image_url: user.background_image_url,
                },
            };
        }
        catch (e) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
    }
    async forgotPassword(email) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new common_1.NotFoundException('Email address not found');
        }
        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);
        await this.prisma.passwordReset.create({
            data: {
                user_id: user.id,
                token_hash: tokenHash,
                expires_at: expiresAt,
            },
        });
        await this.mailService.sendPasswordResetMail(user.email, user.full_name, token);
    }
    async resetPassword(token, newPass) {
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const resetRecord = await this.prisma.passwordReset.findFirst({
            where: {
                token_hash: tokenHash,
                used_at: null,
                expires_at: {
                    gt: new Date(),
                },
            },
            include: {
                user: true,
            },
        });
        if (!resetRecord) {
            throw new common_1.BadRequestException('Invalid or expired password reset token');
        }
        const hashedPassword = await bcrypt.hash(newPass, 10);
        await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: resetRecord.user_id },
                data: { password_hash: hashedPassword },
            }),
            this.prisma.passwordReset.update({
                where: { id: resetRecord.id },
                data: { used_at: new Date() },
            }),
        ]);
        await this.redisService.del(`refresh_token:${resetRecord.user_id}`);
        await this.redisService.del(`users:email:${resetRecord.user.email}`);
        await this.redisService.del(`users:id:${resetRecord.user_id}`);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService,
        redis_service_1.RedisService,
        permissions_service_1.PermissionsService,
        prisma_service_1.PrismaService,
        mail_service_1.MailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map