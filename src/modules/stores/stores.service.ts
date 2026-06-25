import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { Prisma } from '@prisma/client';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { UpdateStoreReturnDto } from './dto/update-store-return.dto';

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
    const { material_ids, material_quantities, ...data } = dto;

    const existingFrame = await this.prisma.store.findFirst({
      where: { frame_number: data.frame_number },
    });
    if (existingFrame) {
      throw new ConflictException('Frame number already exists');
    }

    // Set root quantity as sum of material quantities if provided
    if (material_quantities && material_quantities.length > 0) {
      data.quantity = material_quantities.reduce((sum, q) => sum + q.quantity, 0);
    }

    const store = await this.prisma.store.create({
      data: {
        ...data,
        materials: {
          create: material_ids.map((id) => {
            const qtyObj = material_quantities?.find((q) => q.material_id === id);
            return {
              material: { connect: { id } },
              quantity: qtyObj ? qtyObj.quantity : 1,
            };
          }),
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

    const { material_ids, material_quantities, ...data } = dto;

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

    if (material_quantities && material_quantities.length > 0) {
      data.quantity = material_quantities.reduce((sum, q) => sum + q.quantity, 0);
    }

    const store = await this.prisma.store.update({
      where: { id },
      data: {
        ...data,
        materials: material_ids
          ? {
              deleteMany: {},
              create: material_ids.map((matId) => {
                const qtyObj = material_quantities?.find((q) => q.material_id === matId);
                return {
                  material: { connect: { id: matId } },
                  quantity: qtyObj ? qtyObj.quantity : 1,
                };
              }),
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

  async findByTechnician(
    technicianId: string,
    params: {
      skip?: number;
      take?: number;
      search?: string;
      return_status?: string;
      inflow_status?: string;
      warranty_status?: string;
    },
  ) {
    const {
      skip,
      take,
      search,
      return_status,
      inflow_status,
      warranty_status,
    } = params;
    const where: Prisma.StoreWhereInput = {
      service_engineer_id: technicianId,
      deleted_at: null,
    };

    if (return_status) {
      const lower = return_status.toLowerCase();
      if (lower === 'returned' || lower === 'completed') {
        where.return_status = { in: ['Returned', 'Completed'] };
      } else if (lower === 'pending') {
        where.return_status = 'Pending';
      } else if (lower === 'not returned' || lower === 'not_returned') {
        where.return_status = 'Not Returned';
      } else {
        where.return_status = { equals: return_status, mode: 'insensitive' };
      }
    }
    if (inflow_status) {
      where.inflow_status = { equals: inflow_status, mode: 'insensitive' };
    }
    if (warranty_status) {
      where.warranty_status = { equals: warranty_status, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { frame_number: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
        {
          customer: {
            name: { contains: search, mode: 'insensitive' },
          },
        },
      ];
    }

    const [stores, total] = await Promise.all([
      this.prisma.store.findMany({
        skip,
        take,
        where,
        include: {
          service_engineer: { select: { id: true, full_name: true } },
          customer: { select: { id: true, name: true } },
          materials: {
            include: {
              material: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.store.count({ where }),
    ]);

    return { stores, total };
  }

  async findPendingByTechnician(
    technicianId: string,
    params: { skip?: number; take?: number; search?: string },
  ) {
    const { skip, take, search } = params;
    const where: Prisma.StoreWhereInput = {
      service_engineer_id: technicianId,
      return_status: 'Pending',
      deleted_at: null,
    };

    if (search) {
      where.OR = [
        { frame_number: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
        {
          customer: {
            name: { contains: search, mode: 'insensitive' },
          },
        },
      ];
    }

    const [stores, total] = await Promise.all([
      this.prisma.store.findMany({
        skip,
        take,
        where,
        include: {
          service_engineer: { select: { id: true, full_name: true } },
          customer: { select: { id: true, name: true } },
          materials: {
            include: {
              material: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.store.count({ where }),
    ]);

    return { stores, total };
  }

  async submitReturnDetails(
    storeId: string,
    technicianId: string,
    dto: UpdateStoreReturnDto,
  ) {
    const existing = await this.prisma.store.findFirst({
      where: { id: storeId, deleted_at: null },
    });

    if (!existing) {
      throw new NotFoundException('Store record not found');
    }

    if (existing.service_engineer_id !== technicianId) {
      throw new ForbiddenException(
        'You are not authorized to update this store record',
      );
    }

    if (existing.return_status !== 'Pending') {
      throw new ConflictException(
        `Store return status is already ${existing.return_status}`,
      );
    }

    const store = await this.prisma.store.update({
      where: { id: storeId },
      data: {
        provider_name: dto.provider_name,
        invoice_number: dto.invoice_number,
        return_status: 'Completed',
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

    await this.invalidateCache(storeId);
    return { before: existing, after: store };
  }

  async findByIdAndTechnician(id: string, technicianId: string) {
    const store = await this.findById(id);
    if (!store) {
      throw new NotFoundException('Store record not found');
    }
    if (store.service_engineer_id !== technicianId) {
      throw new ForbiddenException(
        'You are not authorized to access this store record',
      );
    }
    return store;
  }

  async updateByTechnician(
    id: string,
    technicianId: string,
    dto: UpdateStoreDto,
  ) {
    const existing = await this.prisma.store.findFirst({
      where: { id, deleted_at: null },
    });
    if (!existing) {
      throw new NotFoundException('Store record not found');
    }
    if (existing.service_engineer_id !== technicianId) {
      throw new ForbiddenException(
        'You are not authorized to update this store record',
      );
    }
    return this.update(id, dto);
  }

  async removeByTechnician(id: string, technicianId: string) {
    const existing = await this.prisma.store.findFirst({
      where: { id, deleted_at: null },
    });
    if (!existing) {
      throw new NotFoundException('Store record not found');
    }
    if (existing.service_engineer_id !== technicianId) {
      throw new ForbiddenException(
        'You are not authorized to delete this store record',
      );
    }
    return this.remove(id);
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
