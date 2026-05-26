import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import { UpdateServiceCategoryDto } from './dto/update-service-category.dto';

@Injectable()
export class ServiceCategoriesService {
  private readonly CACHE_PREFIX = 'service-category:';
  private readonly LIST_CACHE_KEY = 'service-categories:list:';

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    search?: string;
    status?: string;
  }) {
    const cacheKey = `${this.LIST_CACHE_KEY}${JSON.stringify(params)}`;
    const cachedData = await this.redis.getJson<any>(cacheKey);

    if (cachedData) return cachedData;

    const { skip, take, search, status } = params;

    const where: any = { deleted_at: null };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [serviceCategories, total] = await Promise.all([
      this.prisma.serviceCategory.findMany({ skip, take, where }),
      this.prisma.serviceCategory.count({ where }),
    ]);

    const result = { serviceCategories, total };
    await this.redis.setJson(cacheKey, result, 300); // Cache for 5 mins
    return result;
  }

  async findById(id: string) {
    const cacheKey = `${this.CACHE_PREFIX}id:${id}`;
    const cached = await this.redis.getJson<any>(cacheKey);
    if (cached) return cached;

    const serviceCategory = await this.prisma.serviceCategory.findFirst({
      where: { id, deleted_at: null },
    });

    if (!serviceCategory) {
      throw new NotFoundException(`Service category with ID "${id}" not found`);
    }

    await this.redis.setJson(cacheKey, serviceCategory, 3600); // Cache for 1 hour
    return serviceCategory;
  }

  async create(dto: CreateServiceCategoryDto) {
    const serviceCategory = await this.prisma.serviceCategory.create({
      data: dto,
    });

    await this.invalidateCache();
    return serviceCategory;
  }

  async update(id: string, dto: UpdateServiceCategoryDto) {
    await this.findById(id);

    const serviceCategory = await this.prisma.serviceCategory.update({
      where: { id },
      data: dto,
    });

    await this.invalidateCache(id);
    return serviceCategory;
  }

  async remove(id: string) {
    await this.findById(id);

    const serviceCategory = await this.prisma.serviceCategory.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    await this.invalidateCache(id);
    return serviceCategory;
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
