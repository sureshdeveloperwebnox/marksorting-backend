import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class PermissionsService {
  private readonly CACHE_PREFIX = 'user_permissions:';
  private readonly CACHE_TTL = 3600; // 1 hour

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  /**
   * Get user permissions with caching
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    const cacheKey = `${this.CACHE_PREFIX}${userId}`;
    
    // Try to get from cache first
    const cachedPermissions = await this.redis.getJson<string[]>(cacheKey);
    if (cachedPermissions) {
      return cachedPermissions;
    }

    // Fetch from database
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return [];
    }

    const permissions = user.role.permissions.map(rp => rp.permission.name);
    
    // Cache the permissions
    await this.redis.setJson(cacheKey, permissions, this.CACHE_TTL);
    
    return permissions;
  }

  /**
   * Check if user has specific permission
   */
  async hasPermission(userId: string, permission: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.includes(permission);
  }

  /**
   * Check if user has any of the specified permissions
   */
  async hasAnyPermission(userId: string, permissions: string[]): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);
    return permissions.some(permission => userPermissions.includes(permission));
  }

  /**
   * Check if user has all of the specified permissions
   */
  async hasAllPermissions(userId: string, permissions: string[]): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);
    return permissions.every(permission => userPermissions.includes(permission));
  }

  /**
   * Invalidate user permissions cache
   */
  async invalidateUserPermissionsCache(userId: string): Promise<void> {
    const cacheKey = `${this.CACHE_PREFIX}${userId}`;
    await this.redis.del(cacheKey);
  }

  /**
   * Get all available permissions
   */
  async getAllPermissions() {
    return this.prisma.permission.findMany({
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get permissions by module
   */
  async getPermissionsByModule(module: string) {
    return this.prisma.permission.findMany({
      where: {
        name: {
          startsWith: `${module}.`,
        },
      },
      orderBy: { name: 'asc' },
    });
  }
}
