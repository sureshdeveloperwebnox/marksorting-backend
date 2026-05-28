import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { Prisma } from '@prisma/client';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

@Injectable()
export class StoresService {
  private readonly CACHE_PREFIX = 'store:';
  private readonly LIST_CACHE_KEY = 'stores:list:';

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.StoreWhereInput;
    orderBy?: Prisma.StoreOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params;

    // Generate a unique cache key based on params
    const cacheKey = `${this.LIST_CACHE_KEY}${JSON.stringify(params)}`;
    const cachedData = await this.redis.getJson<any>(cacheKey);

    if (cachedData) return cachedData;

    const [stores, total] = await Promise.all([
      this.prisma.store.findMany({
        skip,
        take,
        where: { ...where, deleted_at: null },
        include: {
          service_engineer: { select: { id: true, full_name: true } },
          customer: { select: { id: true, name: true } },
          materials: {
            include: {
              material: { select: { id: true, name: true } },
            },
          },
        },
        orderBy,
      }),
      this.prisma.store.count({ where: { ...where, deleted_at: null } }),
    ]);

    const result = { stores, total };
    await this.redis.setJson(cacheKey, result, 300); // Cache for 5 mins
    return result;
  }

  async findById(id: string) {
    const cacheKey = `${this.CACHE_PREFIX}id:${id}`;
    const cached = await this.redis.getJson<any>(cacheKey);
    if (cached) return cached;

    const store = await this.prisma.store.findFirst({
      where: { id, deleted_at: null },
      include: {
        service_engineer: { select: { id: true, full_name: true } },
        customer: { select: { id: true, name: true } },
        materials: {
          include: {
            material: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (store) await this.redis.setJson(cacheKey, store, 3600);
    return store;
  }

  async create(dto: CreateStoreDto) {
    const { material_ids, ...data } = dto;

    const existingFrame = await this.prisma.store.findFirst({
      where: { frame_number: data.frame_number },
    });
    if (existingFrame) {
      throw new ConflictException('Frame number already exists');
    }

    const store = await this.prisma.store.create({
      data: {
        ...data,
        materials: {
          create: material_ids.map((id) => ({
            material: { connect: { id } },
          })),
        },
      },
      include: {
        service_engineer: { select: { id: true, full_name: true } },
        customer: { select: { id: true, name: true } },
        materials: {
          include: {
            material: { select: { id: true, name: true } },
          },
        },
      },
    });

    await this.invalidateCache();
    return store;
  }

  async update(id: string, dto: UpdateStoreDto) {
    const existing = await this.prisma.store.findFirst({
      where: { id, deleted_at: null },
    });
    if (!existing) {
      throw new NotFoundException('Store record not found');
    }

    const { material_ids, ...data } = dto;

    if (data.frame_number) {
      const existingFrame = await this.prisma.store.findFirst({
        where: {
          frame_number: data.frame_number,
          id: { not: id },
        },
      });
      if (existingFrame) {
        throw new ConflictException('Frame number already exists');
      }
    }

    const store = await this.prisma.store.update({
      where: { id },
      data: {
        ...data,
        materials: material_ids
          ? {
              deleteMany: {},
              create: material_ids.map((matId) => ({
                material: { connect: { id: matId } },
              })),
            }
          : undefined,
      },
      include: {
        service_engineer: { select: { id: true, full_name: true } },
        customer: { select: { id: true, name: true } },
        materials: {
          include: {
            material: { select: { id: true, name: true } },
          },
        },
      },
    });

    await this.invalidateCache(id);
    return { before: existing, after: store };
  }

  async remove(id: string) {
    const existing = await this.prisma.store.findFirst({
      where: { id, deleted_at: null },
    });
    if (!existing) {
      throw new NotFoundException('Store record not found');
    }

    const store = await this.prisma.store.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    await this.invalidateCache(id);
    return store;
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
