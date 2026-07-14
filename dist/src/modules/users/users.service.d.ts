import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { Prisma } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { S3Service } from '../../shared/services/s3.service';
export declare class UsersService {
    private prisma;
    private redis;
    private s3Service;
    private readonly CACHE_PREFIX;
    private readonly LIST_CACHE_KEY;
    constructor(prisma: PrismaService, redis: RedisService, s3Service: S3Service);
    findAll(params: {
        skip?: number;
        take?: number;
        where?: Prisma.UserWhereInput;
        orderBy?: Prisma.UserOrderByWithRelationInput;
    }): Promise<any>;
    findByEmail(email: string): Promise<any>;
    findById(id: string): Promise<any>;
    create(dto: CreateUserDto): Promise<any>;
    update(id: string, dto: UpdateUserDto, requestingUser?: any): Promise<{
        before: any;
        after: any;
    }>;
    remove(id: string): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        full_name: string;
        email: string;
        phone_number: string | null;
        password_hash: string;
        profile_image: string | null;
        background_image: string | null;
        role_id: string;
        email_verified: boolean;
        phone_verified: boolean;
        account_status: string;
        last_login_at: Date | null;
        failed_login_attempts: number;
        locked_until: Date | null;
        created_by: string | null;
        updated_by: string | null;
    }>;
    getRoles(): Promise<any>;
    private invalidateCache;
    private formatUser;
}
