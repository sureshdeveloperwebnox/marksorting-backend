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
    create(dto: CreateExpenseCategoryDto): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        name: string;
        description: string | null;
        status: string;
    }>;
    update(id: string, dto: UpdateExpenseCategoryDto): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        name: string;
        description: string | null;
        status: string;
    }>;
    remove(id: string): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        name: string;
        description: string | null;
        status: string;
    }>;
    private invalidateCache;
}
