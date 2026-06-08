import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
export declare class PermissionsService {
    private prisma;
    private redis;
    private readonly CACHE_PREFIX;
    private readonly CACHE_TTL;
    constructor(prisma: PrismaService, redis: RedisService);
    getUserPermissions(userId: string): Promise<string[]>;
    hasPermission(userId: string, permission: string): Promise<boolean>;
    hasAnyPermission(userId: string, permissions: string[]): Promise<boolean>;
    hasAllPermissions(userId: string, permissions: string[]): Promise<boolean>;
    invalidateUserPermissionsCache(userId: string): Promise<void>;
    getAllPermissions(): Promise<{
        id: string;
        name: string;
        description: string | null;
    }[]>;
    getPermissionsByModule(module: string): Promise<{
        id: string;
        name: string;
        description: string | null;
    }[]>;
}
