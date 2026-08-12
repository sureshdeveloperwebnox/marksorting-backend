import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { Prisma } from '@prisma/client';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
export declare class CustomersService {
    private prisma;
    private redis;
    private readonly CACHE_PREFIX;
    private readonly LIST_CACHE_KEY;
    constructor(prisma: PrismaService, redis: RedisService);
    findAll(params: {
        skip?: number;
        take?: number;
        where?: Prisma.CustomerWhereInput;
        orderBy?: Prisma.CustomerOrderByWithRelationInput;
    }): Promise<any>;
    findById(id: string): Promise<any>;
    create(dto: CreateCustomerDto): Promise<any>;
    update(id: string, dto: UpdateCustomerDto): Promise<{
        before: any;
        after: any;
    }>;
    remove(id: string): Promise<any>;
    private invalidateCache;
}
