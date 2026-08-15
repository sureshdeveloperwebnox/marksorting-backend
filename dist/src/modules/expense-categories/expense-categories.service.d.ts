import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto';
import { UpdateExpenseCategoryDto } from './dto/update-expense-category.dto';
export declare class ExpenseCategoriesService {
    private prisma;
    private redis;
    private readonly CACHE_PREFIX;
    private readonly LIST_CACHE_KEY;
    constructor(prisma: PrismaService, redis: RedisService);
    findAll(params: {
        skip?: number;
        take?: number;
        search?: string;
        status?: string;
    }): Promise<any>;
    findById(id: string): Promise<any>;
    create(dto: CreateExpenseCategoryDto): Promise<any>;
    update(id: string, dto: UpdateExpenseCategoryDto): Promise<{
        before: any;
        after: any;
    }>;
    remove(id: string): Promise<any>;
    private invalidateCache;
}
