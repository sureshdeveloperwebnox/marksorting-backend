import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { Prisma } from '@prisma/client';
import { CreateMillDto } from './dto/create-mill.dto';
import { UpdateMillDto } from './dto/update-mill.dto';

@Injectable()
export class MillsService {
  private readonly CACHE_PREFIX = 'mill:';
  private readonly LIST_CACHE_KEY = 'mills:list:';

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.MillWhereInput;
    orderBy?: Prisma.MillOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params;

    // Generate a unique cache key based on params
    const cacheKey = `${this.LIST_CACHE_KEY}${JSON.stringify(params)}`;
    const cachedData = await this.redis.getJson<any>(cacheKey);

    if (cachedData) return cachedData;

    const [mills, total] = await Promise.all([
      this.prisma.mill.findMany({
        skip,
        take,
        where: { ...where, deleted_at: null },
        include: { customer: { select: { id: true, name: true } } },
        orderBy,
      }),
      this.prisma.mill.count({ where: { ...where, deleted_at: null } }),
    ]);

    const result = { mills, total };
    await this.redis.setJson(cacheKey, result, 300); // Cache for 5 mins
    return result;
  }

  async findById(id: string) {
    const cacheKey = `${this.CACHE_PREFIX}id:${id}`;
    const cached = await this.redis.getJson<any>(cacheKey);
    if (cached) return cached;

    const mill = await this.prisma.mill.findFirst({
      where: { id, deleted_at: null },
      include: { customer: { select: { id: true, name: true } } },
    });

    if (mill) await this.redis.setJson(cacheKey, mill, 3600);
    return mill;
  }

  async create(dto: CreateMillDto) {
    const mill = await this.prisma.mill.create({
      data: dto,
    });

    await this.invalidateCache();
    return mill;
  }

  async update(id: string, dto: UpdateMillDto) {
    const existing = await this.prisma.mill.findFirst({
      where: { id, deleted_at: null },
    });
    if (!existing) {
      throw new NotFoundException('Mill not found');
    }

    const mill = await this.prisma.mill.update({
      where: { id },
      data: dto,
    });

    await this.invalidateCache(id);
    return mill;
  }

  async remove(id: string) {
    const existing = await this.prisma.mill.findFirst({
      where: { id, deleted_at: null },
    });
    if (!existing) {
      throw new NotFoundException('Mill not found');
    }

    const mill = await this.prisma.mill.update({
      where: { id },
      data: { deleted_at: new Date(), status: 'DELETED' },
    });

    await this.invalidateCache(id);
    return mill;
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
