import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { Prisma } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { S3Service } from '../../shared/services/s3.service';

@Injectable()
export class UsersService {
  private readonly CACHE_PREFIX = 'user:';
  private readonly LIST_CACHE_KEY = 'users:list:';

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private s3Service: S3Service,
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

    const result = {
      users: users.map((u) => this.formatUser(u)),
      total,
    };
    await this.redis.setJson(cacheKey, result, 300); // Cache for 5 mins
    return result;
  }

  async findByEmail(email: string) {
    const cacheKey = `${this.CACHE_PREFIX}email:${email}`;
    const cached = await this.redis.getJson<any>(cacheKey);
    if (cached) return cached;

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        role: { include: { permissions: { include: { permission: true } } } },
      },
    });

    const formattedUser = user ? this.formatUser(user) : null;
    if (formattedUser) await this.redis.setJson(cacheKey, formattedUser, 300);
    return formattedUser;
  }

  async findById(id: string) {
    const cacheKey = `${this.CACHE_PREFIX}id:${id}`;
    const cached = await this.redis.getJson<any>(cacheKey);
    if (cached) return cached;

    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        role: { include: { permissions: { include: { permission: true } } } },
      },
    });

    const formattedUser = user ? this.formatUser(user) : null;
    if (formattedUser) await this.redis.setJson(cacheKey, formattedUser, 300);
    return formattedUser;
  }

  async create(dto: CreateUserDto) {
    const { password, ...data } = dto;

    // Handle empty phone number
    if (data.phone_number === '') {
      (data as any).phone_number = null;
    }

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
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

    const imageAclPromises: Promise<void>[] = [];
    if (user.profile_image) {
      imageAclPromises.push(this.s3Service.makeObjectPublic(user.profile_image));
    }
    if (user.background_image) {
      imageAclPromises.push(this.s3Service.makeObjectPublic(user.background_image));
    }
    if (imageAclPromises.length > 0) {
      await Promise.all(imageAclPromises);
    }

    await this.invalidateCache();
    return this.formatUser(user);
  }

  async update(id: string, dto: UpdateUserDto, requestingUser?: any) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    const { password, ...data } = dto;

    // Security: restrict self-update from elevating privileges or modifying status
    const hasUpdatePermission = requestingUser?.permissions?.includes('users.update');
    const isSelfUpdate = requestingUser?.userId === id;

    if (isSelfUpdate && !hasUpdatePermission) {
      delete data.role_id;
      delete data.account_status;
    }

    if (data.email) {
      const emailConflict = await this.prisma.user.findUnique({
        where: { email: data.email },
      });
      if (emailConflict && emailConflict.id !== id) {
        throw new ConflictException('User with this email already exists');
      }
    }

    const updateData: any = { ...data };
    if (updateData.phone_number === '') {
      updateData.phone_number = null;
    }
    if (password) {
      updateData.password_hash = await bcrypt.hash(password, 10);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: { role: true },
    });

    const imageAclPromises: Promise<void>[] = [];
    if (user.profile_image && user.profile_image !== existingUser.profile_image) {
      imageAclPromises.push(this.s3Service.makeObjectPublic(user.profile_image));
    }
    if (user.background_image && user.background_image !== existingUser.background_image) {
      imageAclPromises.push(this.s3Service.makeObjectPublic(user.background_image));
    }
    if (imageAclPromises.length > 0) {
      await Promise.all(imageAclPromises);
    }

    await this.invalidateCache(id, user.email);
    return {
      before: existingUser ? this.formatUser(existingUser) : null,
      after: this.formatUser(user),
    };
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
    const promises: Promise<any>[] = [
      this.redis.delByPrefix(this.LIST_CACHE_KEY),
    ];
    if (id) promises.push(this.redis.del(`${this.CACHE_PREFIX}id:${id}`));
    if (email)
      promises.push(this.redis.del(`${this.CACHE_PREFIX}email:${email}`));
    promises.push(this.redis.del('users:roles'));
    await Promise.all(promises);
  }

  private formatUser(user: any) {
    if (!user) return null;
    return {
      ...user,
      profile_image_url: user.profile_image
        ? this.s3Service.getFileUrl(user.profile_image)
        : null,
      background_image_url: user.background_image
        ? this.s3Service.getFileUrl(user.background_image)
        : null,
    };
  }
}
