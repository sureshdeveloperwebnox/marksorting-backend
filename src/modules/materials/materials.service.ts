import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { Prisma } from '@prisma/client';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';

@Injectable()
export class MaterialsService {
  private readonly CACHE_PREFIX = 'material:';
  private readonly LIST_CACHE_KEY = 'materials:list:';

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.MaterialWhereInput;
    orderBy?: Prisma.MaterialOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params;

    // Generate a unique cache key based on params
    const cacheKey = `${this.LIST_CACHE_KEY}${JSON.stringify(params)}`;
    const cachedData = await this.redis.getJson<any>(cacheKey);

    if (cachedData) return cachedData;

    const [materials, total] = await Promise.all([
      this.prisma.material.findMany({
        skip,
        take,
        where: { ...where, deleted_at: null },
        orderBy,
      }),
      this.prisma.material.count({ where: { ...where, deleted_at: null } }),
    ]);

    const result = { materials, total };
    await this.redis.setJson(cacheKey, result, 300); // Cache for 5 mins
    return result;
  }

  async findById(id: string) {
    const cacheKey = `${this.CACHE_PREFIX}id:${id}`;
    const cached = await this.redis.getJson<any>(cacheKey);
    if (cached) return cached;

    const material = await this.prisma.material.findFirst({
      where: { id, deleted_at: null },
    });

    if (material) await this.redis.setJson(cacheKey, material, 3600);
    return material;
  }

  async create(dto: CreateMaterialDto) {
    const material = await this.prisma.material.create({
      data: dto,
    });

    await this.invalidateCache();
    return material;
  }

  async update(id: string, dto: UpdateMaterialDto) {
    const existing = await this.prisma.material.findFirst({
      where: { id, deleted_at: null },
    });
    if (!existing) {
      throw new NotFoundException('Material not found');
    }

    const material = await this.prisma.material.update({
      where: { id },
      data: dto,
    });

    await this.invalidateCache(id);
    return material;
  }

  async remove(id: string) {
    const existing = await this.prisma.material.findFirst({
      where: { id, deleted_at: null },
    });
    if (!existing) {
      throw new NotFoundException('Material not found');
    }

    const material = await this.prisma.material.update({
      where: { id },
      data: { deleted_at: new Date(), status: 'DELETED' },
    });

    await this.invalidateCache(id);
    return material;
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
