import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { RedisService } from '../../redis/redis.service';
export declare class AuthService {
    private usersService;
    private jwtService;
    private configService;
    private redisService;
    constructor(usersService: UsersService, jwtService: JwtService, configService: ConfigService, redisService: RedisService);
    validateUser(email: string, pass: string): Promise<any>;
    register(registerDto: any): Promise<{
        access_token: string;
        refresh_token: string;
        user: {
            id: any;
            email: any;
            full_name: any;
            role: any;
            profile_image: any;
            profile_image_url: any;
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
            profile_image: any;
            profile_image_url: any;
        };
    }>;
    getProfile(userId: string): Promise<any>;
    logout(userId: string): Promise<void>;
    decodeToken(token: string): any;
    generateRefreshToken(userId: string): Promise<string>;
    refresh(refreshToken: string): Promise<{
        access_token: string;
        user: {
            id: any;
            email: any;
            full_name: any;
            role: any;
            profile_image: any;
            profile_image_url: any;
        };
    }>;
}
