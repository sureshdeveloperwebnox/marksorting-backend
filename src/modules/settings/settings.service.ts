import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';

@Injectable()
export class SettingsService {
  private readonly CACHE_PREFIX = 'setting:';
  private readonly LIST_CACHE_KEY = 'settings:list:';

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    search?: string;
    group?: string;
  }) {
    const cacheKey = `${this.LIST_CACHE_KEY}${JSON.stringify(params)}`;
    const cachedData = await this.redis.getJson<any>(cacheKey);
    if (cachedData) return cachedData;

    const { skip, take, search, group } = params;

    const where: any = {};

    if (search) {
      where.OR = [
        { key: { contains: search, mode: 'insensitive' } },
        { value: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (group) {
      where.group = group;
    }

    const [settings, total] = await Promise.all([
      this.prisma.setting.findMany({
        skip,
        take,
        where,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.setting.count({ where }),
    ]);

    const result = { settings, total };
    await this.redis.setJson(cacheKey, result, 300); // Cache for 5 mins
    return result;
  }

  async findById(id: string) {
    const cacheKey = `${this.CACHE_PREFIX}id:${id}`;
    const cached = await this.redis.getJson<any>(cacheKey);
    if (cached) return cached;

    const setting = await this.prisma.setting.findUnique({
      where: { id },
    });

    if (!setting) {
      throw new NotFoundException(`Setting with ID "${id}" not found`);
    }

    await this.redis.setJson(cacheKey, setting, 3600); // Cache for 1 hour
    return setting;
  }

  async create(dto: CreateSettingDto) {
    // Check for duplicate key
    const existing = await this.prisma.setting.findUnique({
      where: { key: dto.key },
    });

    if (existing) {
      throw new BadRequestException(
        `Setting with key "${dto.key}" already exists`,
      );
    }

    const setting = await this.prisma.setting.create({
      data: dto,
    });

    await this.invalidateCache();
    return setting;
  }

  async update(id: string, dto: UpdateSettingDto) {
    await this.findById(id);

    if (dto.key) {
      const existing = await this.prisma.setting.findFirst({
        where: { key: dto.key, id: { not: id } },
      });
      if (existing) {
        throw new BadRequestException(
          `Setting with key "${dto.key}" already exists`,
        );
      }
    }

    const setting = await this.prisma.setting.update({
      where: { id },
      data: dto,
    });

    await this.invalidateCache(id);
    return setting;
  }

  async remove(id: string) {
    await this.findById(id);

    const setting = await this.prisma.setting.delete({
      where: { id },
    });

    await this.invalidateCache(id);
    return setting;
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
