import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import { UpdateServiceCategoryDto } from './dto/update-service-category.dto';
export declare class ServiceCategoriesService {
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
    create(dto: CreateServiceCategoryDto): Promise<any>;
    update(id: string, dto: UpdateServiceCategoryDto): Promise<{
        before: any;
        after: any;
    }>;
    remove(id: string): Promise<any>;
    private invalidateCache;
}
