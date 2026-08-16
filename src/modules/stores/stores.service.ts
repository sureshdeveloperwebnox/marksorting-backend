import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
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

    const enrichedStores = await this.enrichStoresWithCustomer(stores);
    const result = { stores: enrichedStores, total };
    await this.redis.setJson(cacheKey, result, 300); // Cache for 5 mins
    return result;
  }

  private async enrichStoresWithCustomer(stores: any[]) {
    const unassigned = stores.filter((s) => (!s.customer || !s.mill) && s.frame_number);
    if (unassigned.length === 0) return stores;

    const frameNumbers = unassigned.map((s) => s.frame_number);
    const masterMills = await this.prisma.masterMill.findMany({
      where: {
        frame_no: { in: frameNumbers },
        deleted_at: null,
      },
      include: {
        mill: {
          include: {
            customer: { select: { id: true, name: true } },
          },
        },
      },
    });

    const customerByFrame = new Map<string, { id: string; name: string }>();
    const millByFrame = new Map<string, { id: string; name: string }>();
    for (const mm of masterMills) {
      if (mm.frame_no && mm.mill) {
        millByFrame.set(mm.frame_no, { id: mm.mill.id, name: mm.mill.name });
        if (mm.mill.customer) {
          customerByFrame.set(mm.frame_no, mm.mill.customer);
        } else if (mm.mill.name) {
          // If mill doesn't have a parent customer, fallback to mill name
          customerByFrame.set(mm.frame_no, { id: mm.mill.id, name: mm.mill.name });
        }
      }
    }

    return stores.map((s) => {
      const resolvedCustomer =
        s.customer ||
        (s.frame_number && customerByFrame.has(s.frame_number)
          ? customerByFrame.get(s.frame_number)
          : null);
      const resolvedMill =
        s.mill ||
        (s.frame_number && millByFrame.has(s.frame_number)
          ? millByFrame.get(s.frame_number)
          : null);

      return {
        ...s,
        customer: resolvedCustomer,
        mill: resolvedMill,
      };
    });
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

    if (store) {
      let enrichedStore = store;
      if (!store.customer && store.frame_number) {
        const [enriched] = await this.enrichStoresWithCustomer([store]);
        enrichedStore = enriched;
      }
      await this.redis.setJson(cacheKey, enrichedStore, 3600);
      return enrichedStore;
    }
    return store;
  }

  async create(dto: CreateStoreDto) {
    const {
      material_ids,
      material_quantities,
      service_engineer_id,
      customer_id,
      service_type,
      ...data
    } = dto;

    if (service_type) {
      if (data.remarks) {
        data.remarks = data.remarks
          .replace(/\s*\|\s*Service Type:\s*[^\s|)]*/gi, '')
          .replace(/\s*Service Type:\s*[^\s|)]*/gi, '')
          .trim();
      }
      const serviceTypeText = `Service Type: ${service_type}`;
      data.remarks = data.remarks
        ? `${data.remarks} | ${serviceTypeText}`
        : serviceTypeText;
    }

    // Auto-resolve customer_id from master_mills by frame_number if not provided
    let resolvedCustomerId = customer_id;
    if (!resolvedCustomerId && data.frame_number) {
      const masterMill = await this.prisma.masterMill.findFirst({
        where: { frame_no: data.frame_number, deleted_at: null },
        include: { mill: { select: { customer_id: true } } },
      });
      if (masterMill?.mill?.customer_id) {
        resolvedCustomerId = masterMill.mill.customer_id;
      }
    }

    // Set root quantity as sum of material quantities if provided
    if (material_quantities && material_quantities.length > 0) {
      data.quantity = material_quantities.reduce(
        (sum, q) => sum + q.quantity,
        0,
      );
    }

    const store = await this.prisma.store.create({
      data: {
        ...data,
        service_engineer: { connect: { id: service_engineer_id } },
        ...(resolvedCustomerId ? { customer: { connect: { id: resolvedCustomerId } } } : {}),
        materials: {
          create: material_ids.map((id) => {
            const qtyObj = material_quantities?.find(
              (q) => q.material_id === id,
            );
            return {
              material: { connect: { id } },
              quantity: qtyObj ? qtyObj.quantity : 1,
              stock_type: qtyObj?.stock_type || 'Inflow',
            };
          }),
        },
      } as any,
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

    const {
      material_ids,
      material_quantities,
      service_engineer_id,
      customer_id,
      service_type,
      ...data
    } = dto;

    if (service_type) {
      if (data.remarks) {
        data.remarks = data.remarks
          .replace(/\s*\|\s*Service Type:\s*[^\s|)]*/gi, '')
          .replace(/\s*Service Type:\s*[^\s|)]*/gi, '')
          .trim();
      }
      const serviceTypeText = `Service Type: ${service_type}`;
      data.remarks = data.remarks
        ? `${data.remarks} | ${serviceTypeText}`
        : serviceTypeText;
    }

    if (material_quantities && material_quantities.length > 0) {
      data.quantity = material_quantities.reduce(
        (sum, q) => sum + q.quantity,
        0,
      );
    }

    const store = await this.prisma.store.update({
      where: { id },
      data: {
        ...data,
        service_engineer: service_engineer_id
          ? { connect: { id: service_engineer_id } }
          : undefined,
        customer: customer_id ? { connect: { id: customer_id } } : undefined,
        materials: material_ids
          ? {
              deleteMany: {},
              create: material_ids.map((matId) => {
                const qtyObj = material_quantities?.find(
                  (q) => q.material_id === matId,
                );
                return {
                  material: { connect: { id: matId } },
                  quantity: qtyObj ? qtyObj.quantity : 1,
                  stock_type: qtyObj?.stock_type || 'Inflow',
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
      } else if (lower === 'in progress' || lower === 'in_progress') {
        where.return_status = 'In Progress';
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

    const enrichedStores = await this.enrichStoresWithCustomer(stores);
    return { stores: enrichedStores, total };
  }

  async findPendingByTechnician(
    technicianId?: string,
    params?: { skip?: number; take?: number; search?: string; status?: string },
  ) {
    const { skip, take, search, status } = params || {};
    const returnStatus = status || 'Pending';
    const where: Prisma.StoreWhereInput = {
      deleted_at: null,
    };

    if (technicianId) {
      where.service_engineer_id = technicianId;
    }

    if (returnStatus.toLowerCase() !== 'all') {
      where.return_status = { equals: returnStatus, mode: 'insensitive' };
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

    const enrichedStores = await this.enrichStoresWithCustomer(stores);
    return { stores: enrichedStores, total };
  }

  async submitReturnDetails(
    storeId: string,
    technicianId?: string,
    dto: UpdateStoreReturnDto = {},
    isUserAdmin: boolean = false,
  ) {
    const existing = await this.prisma.store.findFirst({
      where: { id: storeId, deleted_at: null },
    });

    if (!existing) {
      throw new NotFoundException('Store record not found');
    }

    if (!isUserAdmin && technicianId && existing.service_engineer_id !== technicianId) {
      throw new ForbiddenException(
        'You are not authorized to update this store record',
      );
    }

    // Once status in app becomes completed (return_status in DB is 'In Progress', 'Returned', or 'Completed'), editing is locked for non-admins
    if (
      !isUserAdmin &&
      (existing.return_status === 'In Progress' ||
        existing.return_status === 'Returned' ||
        existing.return_status === 'Completed')
    ) {
      throw new BadRequestException(
        'Store return is already completed and locked. It cannot be edited in the app.',
      );
    }

    // Automatically set status to 'In Progress' for Admin Panel once Courier Service Name and Tracking ID are entered
    const hasCourier = Boolean(
      dto.provider_name &&
        dto.provider_name.trim() !== '' &&
        dto.invoice_number &&
        dto.invoice_number.trim() !== '',
    );

    const targetStatus = hasCourier
      ? 'In Progress'
      : dto.return_status || existing.return_status || 'Pending';

    let finalRemarks = dto.remarks;
    if (
      (!finalRemarks || finalRemarks.trim() === '') &&
      dto.products &&
      Array.isArray(dto.products)
    ) {
      const extractedRemarks = dto.products
        .map((p) => {
          if (typeof p === 'string') return p;
          const r = p?.barcode_remarks?.remarks || p?.remarks;
          const isUsed =
            p?.is_used !== undefined ? p.is_used : p?.barcode_remarks?.is_used;
          if (r && r.trim() !== '') {
            return isUsed !== undefined ? `${isUsed ? '[USED]' : '[NEW]'} ${r}` : r;
          }
          return null;
        })
        .filter(Boolean)
        .join(' | ');
      if (extractedRemarks) {
        finalRemarks = extractedRemarks;
      }
    }

    const store = await this.prisma.store.update({
      where: { id: storeId },
      data: {
        ...(dto.provider_name !== undefined ? { provider_name: dto.provider_name } : {}),
        ...(dto.invoice_number !== undefined ? { invoice_number: dto.invoice_number } : {}),
        ...(finalRemarks !== undefined ? { remarks: finalRemarks } : {}),
        return_status: targetStatus,
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
