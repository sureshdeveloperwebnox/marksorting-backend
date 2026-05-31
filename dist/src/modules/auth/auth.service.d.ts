import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { RedisService } from '../../redis/redis.service';
import { PermissionsService } from '../permissions/permissions.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
export declare class AuthService {
    private usersService;
    private jwtService;
    private configService;
    private redisService;
    private permissionsService;
    private prisma;
    private mailService;
    constructor(usersService: UsersService, jwtService: JwtService, configService: ConfigService, redisService: RedisService, permissionsService: PermissionsService, prisma: PrismaService, mailService: MailService);
    validateUser(email: string, pass: string): Promise<any>;
    validateServiceEngineer(email: string, pass: string): Promise<any>;
    register(registerDto: any): Promise<{
        access_token: string;
        refresh_token: string;
        user: {
            id: any;
            email: any;
            full_name: any;
            role: any;
            permissions: string[];
            profile_image: any;
            profile_image_url: any;
            background_image: any;
            background_image_url: any;
        };
    }>;
    login(user: any): Promise<{
        access_token: string;
        refresh_token: string;
        user: {
            id: any;
            email: any;
            full_name: any;
            role: any;
            permissions: string[];
            profile_image: any;
            profile_image_url: any;
            background_image: any;
            background_image_url: any;
        };
    }>;
    mobileLogin(user: any): Promise<{
        access_token: string;
        refresh_token: string;
    }>;
    getProfile(userId: string): Promise<{
        id: any;
        email: any;
        full_name: any;
        role: any;
        permissions: string[];
        profile_image: any;
        profile_image_url: any;
        background_image: any;
        background_image_url: any;
    }>;
    logout(userId: string): Promise<void>;
    updateProfile(userId: string, dto: UpdateProfileDto): Promise<{
        id: any;
        email: any;
        full_name: any;
        role: any;
        permissions: string[];
        profile_image: any;
        profile_image_url: any;
        background_image: any;
        background_image_url: any;
    }>;
    decodeToken(token: string): any;
    generateRefreshToken(userId: string): Promise<string>;
    refresh(refreshToken: string): Promise<{
        access_token: string;
        user: {
            id: any;
            email: any;
            full_name: any;
            role: any;
            permissions: string[];
            profile_image: any;
            profile_image_url: any;
            background_image: any;
            background_image_url: any;
        };
    }>;
    forgotPassword(email: string): Promise<void>;
    resetPassword(token: string, newPass: string): Promise<void>;
}
