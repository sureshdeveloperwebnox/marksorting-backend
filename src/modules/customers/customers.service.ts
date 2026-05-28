import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { Prisma } from '@prisma/client';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  private readonly CACHE_PREFIX = 'customer:';
  private readonly LIST_CACHE_KEY = 'customers:list:';

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.CustomerWhereInput;
    orderBy?: Prisma.CustomerOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params;

    const cacheKey = `${this.LIST_CACHE_KEY}${JSON.stringify(params)}`;
    const cachedData = await this.redis.getJson<any>(cacheKey);
    if (cachedData) return cachedData;

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        skip,
        take,
        where: { ...where, deleted_at: null },
        orderBy,
      }),
      this.prisma.customer.count({ where: { ...where, deleted_at: null } }),
    ]);

    const result = { customers, total };
    await this.redis.setJson(cacheKey, result, 300);
    return result;
  }

  async findById(id: string) {
    const cacheKey = `${this.CACHE_PREFIX}id:${id}`;
    const cached = await this.redis.getJson<any>(cacheKey);
    if (cached) return cached;

    const customer = await this.prisma.customer.findFirst({
      where: { id, deleted_at: null },
    });

    if (!customer) throw new NotFoundException('Customer not found');

    await this.redis.setJson(cacheKey, customer, 3600);
    return customer;
  }

  async create(dto: CreateCustomerDto) {
    const customer = await this.prisma.customer.create({ data: dto });
    await this.invalidateCache();
    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto) {
    const existing = await this.prisma.customer.findFirst({
      where: { id, deleted_at: null },
    });
    if (!existing) throw new NotFoundException('Customer not found');

    const customer = await this.prisma.customer.update({
      where: { id },
      data: dto,
    });

    await this.invalidateCache(id);
    return { before: existing, after: customer };
  }

  async remove(id: string) {
    const existing = await this.prisma.customer.findFirst({
      where: { id, deleted_at: null },
    });
    if (!existing) throw new NotFoundException('Customer not found');

    const customer = await this.prisma.customer.update({
      where: { id },
      data: { deleted_at: new Date(), status: 'DELETED' },
    });

    await this.invalidateCache(id);
    return customer;
  }

  private async invalidateCache(id?: string) {
    const promises: Promise<any>[] = [
      this.redis.delByPrefix(this.LIST_CACHE_KEY),
    ];
    if (id) promises.push(this.redis.del(`${this.CACHE_PREFIX}id:${id}`));
    await Promise.all(promises);
  }
}
