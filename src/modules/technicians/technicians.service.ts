import {
  Injectable,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class TechniciansService implements OnApplicationBootstrap {
  private readonly CACHE_PREFIX = 'technician:';
  private readonly LIST_CACHE_KEY = 'technicians:list:';

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async onApplicationBootstrap() {
    console.log('Synchronizing technicians on application bootstrap...');
    await this.syncTechnicians();
  }

  /**
   * Synchronizes users with the "Service Engineer" role into the Technician table.
   * Active users are upserted.
   * Technicians whose corresponding users are deleted or no longer have the role are soft-deleted/marked INACTIVE.
   */
  async syncTechnicians(): Promise<void> {
    try {
      // Find the Service Engineer role
      const role = await this.prisma.role.findUnique({
        where: { name: 'Service Engineer' },
      });

      if (!role) {
        return;
      }

      // Find all active users with the Service Engineer role
      const users = await this.prisma.user.findMany({
        where: {
          role_id: role.id,
          deleted_at: null,
          account_status: 'ACTIVE',
        },
      });

      const activeUserIds = users.map((user) => user.id);

      // Upsert each active Service Engineer user as a Technician
      for (const user of users) {
        await this.prisma.technician.upsert({
          where: { id: user.id },
          update: {
            full_name: user.full_name,
            email: user.email,
            phone: user.phone_number,
          },
          create: {
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            phone: user.phone_number,
            status: 'AVAILABLE',
          },
        });
      }

      // Stale technicians: find all active technicians (deleted_at is null)
      // whose ID is not among the active Service Engineer users, and soft-delete/deactivate them
      await this.prisma.technician.updateMany({
        where: {
          id: { notIn: activeUserIds },
          deleted_at: null,
        },
        data: {
          deleted_at: new Date(),
          status: 'INACTIVE',
        },
      });
    } catch (error) {
      // Log errors but do not crash the service, allowing the query to fall back to existing database records
      console.error('Error syncing technicians:', error);
    }
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.TechnicianWhereInput;
    orderBy?: Prisma.TechnicianOrderByWithRelationInput;
  }) {
    // Build the query cache key based on params
    const cacheKey = `${this.LIST_CACHE_KEY}${JSON.stringify(params)}`;
    const cachedData = await this.redis.getJson<any>(cacheKey);
    if (cachedData) return cachedData;

    // Run the sync process. If the database is empty, run synchronously.
    // Otherwise run in the background with a 30-minute cooldown lock.
    const activeCount = await this.prisma.technician.count({
      where: { deleted_at: null },
    });
    if (activeCount === 0) {
      await this.syncTechnicians();
    } else {
      const syncLockKey = 'technicians:sync:lock';
      const isLocked = await this.redis.get(syncLockKey);
      if (!isLocked) {
        await this.redis.set(syncLockKey, 'true', 'EX', 1800); // 30 minutes lock
        this.syncTechnicians().catch((error) => {
          console.error('Background technician sync failed:', error);
        });
      }
    }

    const { skip, take, where, orderBy } = params;

    const [technicians, total] = await Promise.all([
      this.prisma.technician.findMany({
        skip,
        take,
        where: { ...where, deleted_at: null },
        orderBy,
      }),
      this.prisma.technician.count({
        where: { ...where, deleted_at: null },
      }),
    ]);

    const result = { technicians, total };
    await this.redis.setJson(cacheKey, result, 300); // Cache for 5 minutes
    return result;
  }

  async findById(id: string) {
    const cacheKey = `${this.CACHE_PREFIX}id:${id}`;
    const cached = await this.redis.getJson<any>(cacheKey);
    if (cached) return cached;

    const technician = await this.prisma.technician.findFirst({
      where: { id, deleted_at: null },
    });

    if (!technician) {
      throw new NotFoundException('Technician not found');
    }

    await this.redis.setJson(cacheKey, technician, 3600); // Cache for 1 hour
    return technician;
  }

  async updateStatus(id: string, status: string) {
    const existing = await this.prisma.technician.findFirst({
      where: { id, deleted_at: null },
    });
    if (!existing) {
      throw new NotFoundException('Technician not found');
    }

    const technician = await this.prisma.technician.update({
      where: { id },
      data: { status },
    });

    await this.invalidateCache(id);
    return technician;
  }

  private async invalidateCache(id?: string) {
    const promises: Promise<any>[] = [
      this.redis.delByPrefix(this.LIST_CACHE_KEY),
    ];
    if (id) {
      promises.push(this.redis.del(`${this.CACHE_PREFIX}id:${id}`));
    }
    await Promise.all(promises);
  }
}
