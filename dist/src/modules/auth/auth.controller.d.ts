import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
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
        };
    }>;
    register(registerDto: RegisterDto, res: express.Response): Promise<{
        user: {
            id: any;
            email: any;
            full_name: any;
            role: any;
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
        };
    }>;
    getProfile(req: any): any;
}
