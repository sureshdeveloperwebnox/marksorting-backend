import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { MobileLoginDto } from './dto/mobile-login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto, ChangePasswordResponseDto } from './dto/change-password.dto';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import * as express from 'express';
export declare class AuthController {
    private authService;
    private activityLogsService;
    private configService;
    private readonly logger;
    constructor(authService: AuthService, activityLogsService: ActivityLogsService, configService: ConfigService);
    private setTokens;
    login(req: any, res: express.Response): Promise<{
        access_token: string;
        refresh_token: string;
        user: {
            id: any;
            email: any;
            full_name: any;
            role: any;
            permissions: string[];
            phone_number: any;
            mobile_no: any;
            profile_image: any;
            profile_image_url: any;
            background_image: any;
            background_image_url: any;
        };
    }>;
    private getDeviceName;
    register(req: any, registerDto: RegisterDto, res: express.Response): Promise<{
        access_token: string;
        refresh_token: string;
        user: {
            id: any;
            email: any;
            full_name: any;
            role: any;
            permissions: string[];
            phone_number: any;
            mobile_no: any;
            profile_image: any;
            profile_image_url: any;
            background_image: any;
            background_image_url: any;
        };
    }>;
    logout(req: any, res: express.Response): Promise<{
        message: string;
    }>;
    refresh(req: any, res: express.Response): Promise<{
        access_token: string;
        refresh_token: string;
        user: {
            id: any;
            email: any;
            full_name: any;
            role: any;
            permissions: string[];
            phone_number: any;
            mobile_no: any;
            profile_image: any;
            profile_image_url: any;
            background_image: any;
            background_image_url: any;
        };
    }>;
    getProfile(req: any): Promise<{
        id: any;
        email: any;
        full_name: any;
        role: any;
        permissions: string[];
        phone_number: any;
        mobile_no: any;
        profile_image: any;
        profile_image_url: any;
        background_image: any;
        background_image_url: any;
    }>;
    updateProfile(req: any, dto: UpdateProfileDto): Promise<{
        id: any;
        email: any;
        full_name: any;
        role: any;
        permissions: string[];
        phone_number: any;
        mobile_no: any;
        profile_image: any;
        profile_image_url: any;
        background_image: any;
        background_image_url: any;
    }>;
    mobileLogin(mobileLoginDto: MobileLoginDto): Promise<{
        access_token: string;
        refresh_token: string;
    }>;
    forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    changePassword(req: any, changePasswordDto: ChangePasswordDto): Promise<ChangePasswordResponseDto>;
}
