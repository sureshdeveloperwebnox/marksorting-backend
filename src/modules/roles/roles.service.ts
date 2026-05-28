import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { Prisma } from '@prisma/client';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  private readonly CACHE_PREFIX = 'role:';
  private readonly LIST_CACHE_KEY = 'roles:list:';

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.RoleWhereInput;
    orderBy?: Prisma.RoleOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params;

    const cacheKey = `${this.LIST_CACHE_KEY}${JSON.stringify(params)}`;
    const cachedData = await this.redis.getJson<any>(cacheKey);

    if (cachedData) return cachedData;

    const [roles, total] = await Promise.all([
      this.prisma.role.findMany({
        skip,
        take,
        where,
        orderBy,
        include: {
          _count: {
            select: { users: true },
          },
        },
      }),
      this.prisma.role.count({ where }),
    ]);

    const result = { roles, total };
    await this.redis.setJson(cacheKey, result, 300);
    return result;
  }

  async findById(id: string) {
    const cacheKey = `${this.CACHE_PREFIX}id:${id}`;
    const cached = await this.redis.getJson<any>(cacheKey);
    if (cached) return cached;

    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: { permission: true },
        },
        _count: {
          select: { users: true },
        },
      },
    });

    if (!role) throw new NotFoundException('Role not found');

    const formattedRole = this.formatRole(role);
    await this.redis.setJson(cacheKey, formattedRole, 3600);
    return formattedRole;
  }

  async create(dto: CreateRoleDto) {
    const existingRole = await this.prisma.role.findUnique({
      where: { name: dto.name },
    });
    if (existingRole) {
      throw new ConflictException('Role with this name already exists');
    }

    const role = await this.prisma.role.create({
      data: {
        name: dto.name,
        description: dto.description,
        ...(dto.permission_ids &&
          dto.permission_ids.length > 0 && {
            permissions: {
              create: dto.permission_ids.map((permissionId) => ({
                permission: { connect: { id: permissionId } },
              })),
            },
          }),
      },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    await this.invalidateCache();
    return this.formatRole(role);
  }

  async update(id: string, dto: UpdateRoleDto) {
    const existingRole = await this.prisma.role.findUnique({ where: { id } });
    if (!existingRole) throw new NotFoundException('Role not found');

    if (dto.name && dto.name !== existingRole.name) {
      const duplicate = await this.prisma.role.findUnique({
        where: { name: dto.name },
      });
      if (duplicate)
        throw new ConflictException('Role with this name already exists');
    }

    const updateData: any = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;

    if (dto.permission_ids !== undefined) {
      await this.prisma.rolePermission.deleteMany({ where: { role_id: id } });
      if (dto.permission_ids.length > 0) {
        updateData.permissions = {
          create: dto.permission_ids.map((permissionId) => ({
            permission: { connect: { id: permissionId } },
          })),
        };
      }
    }

    const role = await this.prisma.role.update({
      where: { id },
      data: updateData,
      include: {
        permissions: {
          include: { permission: true },
        },
        _count: {
          select: { users: true },
        },
      },
    });

    await this.invalidateCache(id, dto.permission_ids !== undefined);
    return this.formatRole(role);
  }

  async remove(id: string) {
    const existingRole = await this.prisma.role.findUnique({ where: { id } });
    if (!existingRole) throw new NotFoundException('Role not found');

    const userCount = await this.prisma.user.count({ where: { role_id: id } });
    if (userCount > 0) {
      throw new ConflictException('Cannot delete role that has assigned users');
    }

    await this.prisma.rolePermission.deleteMany({ where: { role_id: id } });
    await this.prisma.role.delete({ where: { id } });

    await this.invalidateCache(id);
    return { message: 'Role deleted successfully' };
  }

  private async invalidateCache(id?: string, invalidateUserPermissions = false) {
    const promises: Promise<any>[] = [
      this.redis.delByPrefix(this.LIST_CACHE_KEY),
    ];
    if (id) promises.push(this.redis.del(`${this.CACHE_PREFIX}id:${id}`));
    if (invalidateUserPermissions) {
      promises.push(this.redis.delByPrefix('user_permissions:'));
    }
    await Promise.all(promises);
  }

  async getAllPermissions() {
    return this.prisma.permission.findMany({
      orderBy: { name: 'asc' },
    });
  }

  private formatRole(role: any) {
    if (!role) return null;
    return {
      ...role,
      permissions: role.permissions?.map((rp: any) => rp.permission) || [],
    };
  }
}
