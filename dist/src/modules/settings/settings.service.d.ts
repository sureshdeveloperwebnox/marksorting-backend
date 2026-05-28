import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
export declare class SettingsService {
    private prisma;
    private redis;
    private readonly CACHE_PREFIX;
    private readonly LIST_CACHE_KEY;
    constructor(prisma: PrismaService, redis: RedisService);
    findAll(params: {
        skip?: number;
        take?: number;
        search?: string;
        group?: string;
    }): Promise<any>;
    findById(id: string): Promise<any>;
    create(dto: CreateSettingDto): Promise<{
        id: string;
        key: string;
        value: string;
        group: string;
        created_at: Date;
        updated_at: Date;
    }>;
    update(id: string, dto: UpdateSettingDto): Promise<{
        before: any;
        after: {
            id: string;
            key: string;
            value: string;
            group: string;
            created_at: Date;
            updated_at: Date;
        };
    }>;
    remove(id: string): Promise<{
        id: string;
        key: string;
        value: string;
        group: string;
        created_at: Date;
        updated_at: Date;
    }>;
    private invalidateCache;
}
