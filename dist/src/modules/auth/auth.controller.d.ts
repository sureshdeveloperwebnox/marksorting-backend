import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { MobileLoginDto } from './dto/mobile-login.dto';
import * as express from 'express';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    private setTokens;
    login(req: any, res: express.Response): Promise<{
        user: {
            id: any;
            email: any;
            full_name: any;
            role: any;
            profile_image: any;
            profile_image_url: any;
            background_image: any;
            background_image_url: any;
        };
    }>;
    register(registerDto: RegisterDto, res: express.Response): Promise<{
        user: {
            id: any;
            email: any;
            full_name: any;
            role: any;
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
        user: {
            id: any;
            email: any;
            full_name: any;
            role: any;
            profile_image: any;
            profile_image_url: any;
            background_image: any;
            background_image_url: any;
        };
    }>;
    getProfile(req: any): Promise<any>;
    mobileLogin(mobileLoginDto: MobileLoginDto): Promise<{
        access_token: string;
        refresh_token: string;
    }>;
}
