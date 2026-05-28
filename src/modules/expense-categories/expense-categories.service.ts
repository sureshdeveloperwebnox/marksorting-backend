import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto';
import { UpdateExpenseCategoryDto } from './dto/update-expense-category.dto';

@Injectable()
export class ExpenseCategoriesService {
  private readonly CACHE_PREFIX = 'expense-category:';
  private readonly LIST_CACHE_KEY = 'expense-categories:list:';

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

    const [expenseCategories, total] = await Promise.all([
      this.prisma.expenseCategory.findMany({
        skip,
        take,
        where,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.expenseCategory.count({ where }),
    ]);

    const result = { expenseCategories, total };
    await this.redis.setJson(cacheKey, result, 300); // Cache for 5 mins
    return result;
  }

  async findById(id: string) {
    const cacheKey = `${this.CACHE_PREFIX}id:${id}`;
    const cached = await this.redis.getJson<any>(cacheKey);
    if (cached) return cached;

    const expenseCategory = await this.prisma.expenseCategory.findFirst({
      where: { id, deleted_at: null },
    });

    if (!expenseCategory) {
      throw new NotFoundException(`Expense category with ID "${id}" not found`);
    }

    await this.redis.setJson(cacheKey, expenseCategory, 3600); // Cache for 1 hour
    return expenseCategory;
  }

  async create(dto: CreateExpenseCategoryDto) {
    const expenseCategory = await this.prisma.expenseCategory.create({
      data: dto,
    });

    await this.invalidateCache();
    return expenseCategory;
  }

  async update(id: string, dto: UpdateExpenseCategoryDto) {
    const existing = await this.findById(id);

    const expenseCategory = await this.prisma.expenseCategory.update({
      where: { id },
      data: dto,
    });

    await this.invalidateCache(id);
    return { before: existing, after: expenseCategory };
  }

  async remove(id: string) {
    await this.findById(id);

    const expenseCategory = await this.prisma.expenseCategory.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    await this.invalidateCache(id);
    return expenseCategory;
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
