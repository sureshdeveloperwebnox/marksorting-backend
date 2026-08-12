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
    remove(id: string): Promise<any>;
    getRoles(): Promise<any>;
    private invalidateCache;
    private formatUser;
}
