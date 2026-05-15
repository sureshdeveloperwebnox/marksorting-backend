import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { Prisma } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  private readonly CACHE_PREFIX = 'user:';
  private readonly LIST_CACHE_KEY = 'users:list:';

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params;
    
    // Generate a unique cache key based on params
    const cacheKey = `${this.LIST_CACHE_KEY}${JSON.stringify(params)}`;
    const cachedData = await this.redis.getJson<any>(cacheKey);
    
    if (cachedData) return cachedData;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take,
        where: { ...where, deleted_at: null },
        orderBy,
        include: { role: true },
      }),
      this.prisma.user.count({ where: { ...where, deleted_at: null } }),
    ]);

    const result = { users, total };
    await this.redis.setJson(cacheKey, result, 300); // Cache for 5 mins
    return result;
  }

  async findByEmail(email: string) {
    const cacheKey = `${this.CACHE_PREFIX}email:${email}`;
    const cached = await this.redis.getJson<any>(cacheKey);
    if (cached) return cached;

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });

    if (user) await this.redis.setJson(cacheKey, user, 3600);
    return user;
  }

  async findById(id: string) {
    const cacheKey = `${this.CACHE_PREFIX}id:${id}`;
    const cached = await this.redis.getJson<any>(cacheKey);
    if (cached) return cached;

    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });

    if (user) await this.redis.setJson(cacheKey, user, 3600);
    return user;
  }

  async create(dto: CreateUserDto) {
    const { password, ...data } = dto;
    
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const password_hash = await bcrypt.hash(password, 10);
    
    const user = await this.prisma.user.create({
      data: {
        ...data,
        password_hash,
      },
      include: { role: true },
    });
    
    await this.invalidateCache();
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    const { password, ...data } = dto;
    
    const updateData: any = { ...data };
    if (password) {
      updateData.password_hash = await bcrypt.hash(password, 10);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: { role: true },
    });

    await this.invalidateCache(id, user.email);
    return user;
  }

  async remove(id: string) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { deleted_at: new Date(), account_status: 'DELETED' },
    });

    await this.invalidateCache(id, user.email);
    return user;
  }

  async getRoles() {
    const cacheKey = 'users:roles';
    const cached = await this.redis.getJson<any>(cacheKey);
    if (cached) return cached;

    const roles = await this.prisma.role.findMany();
    await this.redis.setJson(cacheKey, roles, 3600);
    return roles;
  }

  private async invalidateCache(id?: string, email?: string) {
    const promises: Promise<any>[] = [this.redis.delByPrefix(this.LIST_CACHE_KEY)];
    if (id) promises.push(this.redis.del(`${this.CACHE_PREFIX}id:${id}`));
    if (email) promises.push(this.redis.del(`${this.CACHE_PREFIX}email:${email}`));
    promises.push(this.redis.del('users:roles'));
    await Promise.all(promises);
  }
}
