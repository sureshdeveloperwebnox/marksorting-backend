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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AuthController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const local_auth_guard_1 = require("./guards/local-auth.guard");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const swagger_1 = require("@nestjs/swagger");
const login_dto_1 = require("./dto/login.dto");
const register_dto_1 = require("./dto/register.dto");
const mobile_login_dto_1 = require("./dto/mobile-login.dto");
const mobile_login_response_dto_1 = require("./dto/mobile-login-response.dto");
const update_profile_dto_1 = require("./dto/update-profile.dto");
const forgot_password_dto_1 = require("./dto/forgot-password.dto");
const reset_password_dto_1 = require("./dto/reset-password.dto");
const change_password_dto_1 = require("./dto/change-password.dto");
const activity_logs_service_1 = require("../activity-logs/activity-logs.service");
const activity_action_enum_1 = require("../activity-logs/enums/activity-action.enum");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const express = __importStar(require("express"));
let AuthController = AuthController_1 = class AuthController {
    authService;
    activityLogsService;
    logger = new common_1.Logger(AuthController_1.name);
    constructor(authService, activityLogsService) {
        this.authService = authService;
        this.activityLogsService = activityLogsService;
    }
    setTokens(req, res, result) {
        const isProduction = process.env.NODE_ENV === 'production';
        const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
        const host = (req.headers.host || '').toLowerCase();
        const origin = (req.headers.origin || '').toLowerCase();
        const isNgrok = host.includes('ngrok') || origin.includes('ngrok');
        const cookieSecure = isProduction || isSecure;
        const cookieSameSite = isNgrok ? 'none' : 'lax';
        res.cookie('access_token', result.access_token, {
            httpOnly: true,
            secure: cookieSecure,
            sameSite: cookieSameSite,
            maxAge: 15 * 60 * 1000,
            path: '/',
        });
        if (result.refresh_token) {
            res.cookie('refresh_token', result.refresh_token, {
                httpOnly: true,
                secure: cookieSecure,
                sameSite: cookieSameSite,
                maxAge: 7 * 24 * 60 * 60 * 1000,
                path: '/',
            });
        }
    }
    async login(req, res) {
        const result = await this.authService.login(req.user);
        this.setTokens(req, res, result);
        const userAgent = req.headers['user-agent'];
        const deviceName = this.getDeviceName(userAgent);
        const roleName = result.user.role?.name || result.user.role || 'Unknown Role';
        await this.activityLogsService.create({
            user_id: result.user.id,
            action: activity_action_enum_1.ActivityAction.LOGIN,
            description: `"${result.user.full_name}" (${result.user.email}) logged in — Role: ${roleName} | Device: ${deviceName || 'Unknown'} | IP: ${req.ip || 'N/A'}`,
            metadata: {
                role: result.user.role,
                ip_address: req.ip,
                device: deviceName,
            },
            ip_address: req.ip,
            user_agent: userAgent,
            device_name: deviceName,
        });
        return {
            access_token: result.access_token,
            refresh_token: result.refresh_token,
            user: result.user,
        };
    }
    getDeviceName(userAgent) {
        if (!userAgent)
            return undefined;
        if (userAgent.includes('Mobile'))
            return 'Mobile';
        if (userAgent.includes('Tablet'))
            return 'Tablet';
        if (userAgent.includes('Windows'))
            return 'Windows';
        if (userAgent.includes('Mac'))
            return 'Mac';
        if (userAgent.includes('Linux'))
            return 'Linux';
        return 'Unknown';
    }
    async register(req, registerDto, res) {
        const result = await this.authService.register(registerDto);
        this.setTokens(req, res, result);
        return {
            access_token: result.access_token,
            refresh_token: result.refresh_token,
            user: result.user,
        };
    }
    async logout(req, res) {
        let userId = null;
        let userEmail = 'Unknown';
        try {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.split(' ')[1];
                const payload = this.authService.decodeToken(token);
                if (payload?.sub) {
                    userId = payload.sub;
                    userEmail = payload.email || 'Unknown';
                    await this.authService.logout(payload.sub);
                }
            }
        }
        catch (e) {
        }
        if (userId) {
            const userAgent = req.headers['user-agent'];
            const deviceName = this.getDeviceName(userAgent);
            await this.activityLogsService.create({
                user_id: userId,
                action: activity_action_enum_1.ActivityAction.LOGOUT,
                description: `"${userEmail}" logged out — Device: ${deviceName || 'Unknown'} | IP: ${req.ip || 'N/A'} | Session ended`,
                ip_address: req.ip,
                user_agent: userAgent,
                device_name: deviceName,
            });
        }
        res.clearCookie('access_token', { path: '/' });
        res.clearCookie('refresh_token', { path: '/' });
        return { message: 'Logged out successfully' };
    }
    async refresh(req, res) {
        let refreshToken = req.cookies?.['refresh_token'];
        if (!refreshToken && req.headers.authorization) {
            const parts = req.headers.authorization.split(' ');
            if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
                refreshToken = parts[1];
            }
        }
        if (!refreshToken) {
            throw new common_1.UnauthorizedException('Refresh token not found');
        }
        const result = await this.authService.refresh(refreshToken);
        this.setTokens(req, res, result);
        return {
            access_token: result.access_token,
            refresh_token: result.refresh_token,
            user: result.user,
        };
    }
    async getProfile(req) {
        return this.authService.getProfile(req.user.userId);
    }
    async updateProfile(req, dto) {
        return this.authService.updateProfile(req.user.userId, dto);
    }
    async mobileLogin(mobileLoginDto) {
        const user = await this.authService.validateServiceEngineer(mobileLoginDto.email, mobileLoginDto.password);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid email/password or user is not a service engineer');
        }
        return this.authService.mobileLogin(user);
    }
    async forgotPassword(forgotPasswordDto) {
        await this.authService.forgotPassword(forgotPasswordDto.email);
        return { message: 'If the email exists, a password reset link has been sent' };
    }
    async resetPassword(resetPasswordDto) {
        await this.authService.resetPassword(resetPasswordDto.token, resetPasswordDto.password);
        return { message: 'Password has been reset successfully' };
    }
    async changePassword(req, changePasswordDto) {
        await this.authService.changePassword(req.user.userId, changePasswordDto.current_password, changePasswordDto.new_password);
        await this.activityLogsService.create({
            user_id: req.user.userId,
            action: activity_action_enum_1.ActivityAction.UPDATE,
            description: `Service engineer "${req.user.full_name || req.user.email}" changed their password`,
            metadata: {
                ip_address: req.ip,
                user_agent: req.headers['user-agent'],
            },
            ip_address: req.ip,
            user_agent: req.headers['user-agent'],
        });
        return { message: 'Password changed successfully. Please login again with your new password.' };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.UseGuards)(local_auth_guard_1.LocalAuthGuard),
    (0, common_1.Post)('login'),
    (0, swagger_1.ApiOperation)({ summary: 'Login with email and password' }),
    (0, swagger_1.ApiBody)({ type: login_dto_1.LoginDto }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('register'),
    (0, swagger_1.ApiOperation)({ summary: 'Register a new account' }),
    (0, swagger_1.ApiBody)({ type: register_dto_1.RegisterDto }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, register_dto_1.RegisterDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('logout'),
    (0, swagger_1.ApiOperation)({ summary: 'Logout user' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('refresh'),
    (0, swagger_1.ApiOperation)({ summary: 'Refresh access token' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('profile'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user profile' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getProfile", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Put)('profile'),
    (0, swagger_1.ApiOperation)({ summary: 'Update current user profile' }),
    (0, swagger_1.ApiBody)({ type: update_profile_dto_1.UpdateProfileDto }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_profile_dto_1.UpdateProfileDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "updateProfile", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('mobile/login'),
    (0, swagger_1.ApiOperation)({ summary: 'Login for service engineers (mobile clients)' }),
    (0, swagger_1.ApiBody)({ type: mobile_login_dto_1.MobileLoginDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Successful login',
        type: mobile_login_response_dto_1.MobileLoginResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Invalid credentials or not a service engineer',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mobile_login_dto_1.MobileLoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "mobileLogin", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('forgot-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Request password reset link' }),
    (0, swagger_1.ApiBody)({ type: forgot_password_dto_1.ForgotPasswordDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Reset email queued successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [forgot_password_dto_1.ForgotPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('reset-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Reset password using token' }),
    (0, swagger_1.ApiBody)({ type: reset_password_dto_1.ResetPasswordDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Password reset successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reset_password_dto_1.ResetPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('Service Engineer'),
    (0, common_1.Post)('mobile/change-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Change password for service engineers (mobile app)',
        description: 'Allows authenticated service engineers to change their password. Requires current password verification. All existing sessions will be invalidated after password change.',
    }),
    (0, swagger_1.ApiBody)({ type: change_password_dto_1.ChangePasswordDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Password changed successfully. User must login again.',
        type: change_password_dto_1.ChangePasswordResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Unauthorized - Invalid current password or user is not a service engineer',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Bad Request - New password validation failed or same as current password',
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, change_password_dto_1.ChangePasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "changePassword", null);
exports.AuthController = AuthController = AuthController_1 = __decorate([
    (0, swagger_1.ApiTags)('Authentication'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        activity_logs_service_1.ActivityLogsService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map