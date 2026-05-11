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
    login(user: any): Promise<{
        access_token: string;
        refresh_token: string;
    }>;
    generateRefreshToken(userId: string): Promise<string>;
}
