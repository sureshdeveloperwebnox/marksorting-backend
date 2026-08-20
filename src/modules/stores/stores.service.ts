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
import { EventEmitter2 } from '@nestjs/event-emitter';
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
    private eventEmitter: EventEmitter2,
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

    this.eventEmitter.emit('store.created', {
      storeId: store.id,
      frameNumber: store.frame_number,
      technicianUserId: store.service_engineer_id,
      inflowStatus: store.inflow_status,
      quantity: store.quantity,
    });

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

    if (store.return_status && store.return_status !== existing.return_status) {
      this.eventEmitter.emit('store.return_updated', {
        storeId: store.id,
        frameNumber: store.frame_number,
        returnStatus: store.return_status,
        technicianUserId: store.service_engineer_id,
      });
    }

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
      const extractedRemarks = this.constructRemarksFromProducts(
        existing.remarks,
        dto.products,
      );
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

    if (store.return_status && store.return_status !== existing.return_status) {
      this.eventEmitter.emit('store.return_updated', {
        storeId: store.id,
        frameNumber: store.frame_number,
        returnStatus: store.return_status,
        technicianUserId: store.service_engineer_id,
      });
    }

    return {
      before: existing,
      after: store,
      quantity_summary: this.calculateQuantitySummary(store),
    };
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

  private extractCleanRemarks(remarks?: string | null): string {
    if (!remarks) return '';
    let cleaned = remarks;
    const serialIdx = cleaned.search(/\(?\s*Serial Nos:/i);
    if (serialIdx !== -1) {
      cleaned = cleaned.substring(0, serialIdx);
    }
    const stIdx = cleaned.search(/\(?\s*Service Type:/i);
    if (stIdx !== -1) {
      cleaned = cleaned.substring(0, stIdx);
    }
    cleaned = cleaned.replace(/[\(\)\|\s,]+$/, '').trim();
    return cleaned;
  }

  private parseServiceTypeFromRemarks(remarks?: string | null): string {
    if (!remarks) return 'Acknowledgement';
    const matches = [...remarks.matchAll(/Service Type:\s*([^\s|)]+)/gi)];
    if (matches.length > 0) {
      const lastMatch = matches[matches.length - 1];
      if (lastMatch && lastMatch[1]) {
        const val = lastMatch[1].trim();
        if (/^replacement$/i.test(val)) return 'Replacement';
        if (/^acknowledgement|payment$/i.test(val)) return 'Acknowledgement';
      }
    }
    return 'Acknowledgement';
  }

  private splitSerialsString(str: string): string[] {
    const result: string[] = [];
    let current = '';
    let parenDepth = 0;

    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      if (char === '(') {
        parenDepth++;
        current += char;
      } else if (char === ')') {
        if (parenDepth > 0) parenDepth--;
        current += char;
      } else if (char === ',' && parenDepth === 0) {
        if (current.trim()) result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    if (current.trim()) {
      result.push(current.trim());
    }

    return result.filter((s: string) => {
      const t = s.trim();
      const isOrphan = /^(RETURNED|NOT_RETURNED|ENG_ACK:|ADM_ACK:)/i.test(t);
      return !isOrphan && t.length > 0;
    });
  }

  private cleanBarcodeString(str: string): string {
    let clean = str;
    // Remove parenthesized content
    clean = clean.replace(/\(.*?\)/g, '');
    clean = clean.replace(/\[.*?\]/g, '');
    // Remove unclosed/unopened tag keywords and everything after them
    clean = clean.replace(
      /(?:,\s*)?(?:RETURNED|NOT_RETURNED|ENG_ACK:[^,;)]+|ADM_ACK:[^,;)]+|RET:[^,;)]+|USED).*/gi,
      '',
    );
    // Strip leftover punctuation
    clean = clean.replace(/[()\[\];,:]+/g, ' ');
    return clean.trim();
  }

  private parseSerialMapFromRemarks(
    remarks?: string | null,
  ): Record<
    string,
    {
      barcode: string;
      used: boolean;
      return_status?: string;
      engineer_ack?: string;
      admin_ack?: string;
    }[]
  > {
    if (!remarks) return {};
    const map: Record<
      string,
      {
        barcode: string;
        used: boolean;
        return_status?: string;
        engineer_ack?: string;
        admin_ack?: string;
      }[]
    > = {};

    const serialNosIdx = remarks.indexOf('Serial Nos:');
    if (serialNosIdx === -1) return {};

    let serialStr = remarks.substring(serialNosIdx + 'Serial Nos:'.length);
    const stIdx = serialStr.indexOf('Service Type:');
    if (stIdx !== -1) {
      serialStr = serialStr.substring(0, stIdx);
    }
    serialStr = serialStr.replace(/[\)\|\s]+$/, '').trim();

    const parts = serialStr.split('|');
    parts.forEach((part) => {
      const colIdx = part.indexOf(':');
      if (colIdx !== -1) {
        const matName = part.substring(0, colIdx).trim();
        const serialsStr = part.substring(colIdx + 1).trim();
        const bracketMatch = serialsStr.match(/\[(.*?)\]/);
        if (bracketMatch && bracketMatch[1]) {
          const rawSerials = this.splitSerialsString(bracketMatch[1]);
          const serials = rawSerials
            .map((s: string) => s.trim())
            .filter(Boolean)
            .map((s: string) => {
              const used = /\(USED/i.test(s) || /USED/i.test(s);
              const isNotReturned = /NOT_RETURNED|RET:Not Returned|Not Returned/i.test(s);
              const engAckMatch = s.match(/ENG_ACK:(Acknowledged|Pending)/i);
              const admAckMatch = s.match(/ADM_ACK:(Acknowledged|Pending)/i);
              const cleanCode = this.cleanBarcodeString(s);

              return {
                barcode: cleanCode,
                used,
                return_status: used
                  ? isNotReturned
                    ? 'Not Returned'
                    : 'Returned'
                  : undefined,
                engineer_ack: used
                  ? engAckMatch
                    ? engAckMatch[1]
                    : 'Acknowledged'
                  : undefined,
                admin_ack: used
                  ? admAckMatch
                    ? admAckMatch[1]
                    : 'Pending'
                  : undefined,
              };
            })
            .filter((s: { barcode: string }) => s.barcode);
          map[matName] = serials;
        }
      }
    });

    return map;
  }

  private constructRemarksFromProducts(
    existingRemarks: string | null | undefined,
    products: any[],
  ): string | null {
    if (!products || !Array.isArray(products) || products.length === 0) {
      return null;
    }

    const hasStructuredBarcodes = products.some(
      (p) => p && Array.isArray(p.barcodes) && p.barcodes.length > 0,
    );

    if (hasStructuredBarcodes) {
      const cleanRemarks = this.extractCleanRemarks(existingRemarks);
      const serviceType = this.parseServiceTypeFromRemarks(existingRemarks);
      const currentSerialMap = this.parseSerialMapFromRemarks(existingRemarks);

      for (const prod of products) {
        const matName = prod.material_name || prod.name;
        if (!matName || !Array.isArray(prod.barcodes)) continue;

        currentSerialMap[matName] = prod.barcodes.map((b: any) => {
          const barcode = b.barcode || (typeof b === 'string' ? b : '');
          const used = Boolean(b.used);
          const retStatus = used
            ? b.return_status === 'Not Returned'
              ? 'Not Returned'
              : 'Returned'
            : undefined;
          const engAck = used
            ? b.acknowledge_status === 'Pending'
              ? 'Pending'
              : 'Acknowledged'
            : undefined;
          const admAck = b.admin_acknowledge_status || 'Pending';
          return {
            barcode,
            used,
            return_status: retStatus,
            engineer_ack: engAck,
            admin_ack: admAck,
          };
        });
      }

      const serialSummaries: string[] = [];
      Object.entries(currentSerialMap).forEach(([matName, items]) => {
        if (items.length > 0) {
          const itemStrs = items.map((it: any) => {
            if (!it.used) return it.barcode;
            const tags: string[] = ['USED'];
            if (it.return_status) {
              tags.push(`RET:${it.return_status}`);
            }
            if (it.engineer_ack) tags.push(`ENG_ACK:${it.engineer_ack}`);
            if (it.admin_ack) tags.push(`ADM_ACK:${it.admin_ack}`);
            return `${it.barcode} (${tags.join('; ')})`;
          });
          serialSummaries.push(`${matName}: [${itemStrs.join(', ')}]`);
        }
      });

      const extraParts: string[] = [];
      if (serialSummaries.length > 0) {
        extraParts.push(`Serial Nos: ${serialSummaries.join(' | ')}`);
      }
      if (serviceType) {
        extraParts.push(`Service Type: ${serviceType}`);
      }

      const extraText = extraParts.join(' | ');
      return cleanRemarks ? `${cleanRemarks} (${extraText})` : `(${extraText})`;
    }

    // Fallback to legacy array of objects / strings
    const extractedRemarks = products
      .map((p) => {
        if (typeof p === 'string') return p;
        if (p && typeof p === 'object') {
          const name = p.name || p.material_name || p.barcode || '';
          const qty = p.quantity !== undefined ? p.quantity : p.qty;
          const parts: string[] = [];
          if (name) parts.push(name);
          if (qty !== undefined) parts.push(`qty: ${qty}`);
          if (p.used !== undefined) parts.push(`used: ${p.used}`);
          if (p.return_status) parts.push(`return_status: ${p.return_status}`);
          if (p.acknowledge_status)
            parts.push(`acknowledge_status: ${p.acknowledge_status}`);
          return parts.join(' - ');
        }
        return '';
      })
      .filter(Boolean)
      .join(' | ');

    return extractedRemarks || null;
  }

  calculateQuantitySummary(store: any): any {
    const fullSerialMap = this.parseSerialMapFromRemarks(store?.remarks);
    const materials = store?.materials || [];

    let totalQty = 0;
    let usedQty = 0;
    let returnedQty = 0;
    let notReturnedQty = 0;
    let engAckQty = 0;
    let engPendingQty = 0;
    let admAckQty = 0;
    let admPendingQty = 0;

    const materialsBreakdown = materials.map((m: any) => {
      const matName = m.material?.name || '';
      const units = fullSerialMap[matName] || [];
      const mTotal = m.quantity || units.length || 1;
      const mUsed = units.filter((u: any) => u.used).length;
      const mUnused = Math.max(0, mTotal - mUsed);
      const mReturned = units.filter((u: any) => u.used && u.return_status === 'Returned').length;
      const mNotReturned = units.filter((u: any) => u.used && u.return_status === 'Not Returned').length;
      const mEngAck = units.filter((u: any) => u.used && u.engineer_ack === 'Acknowledged').length;
      const mEngPending = units.filter((u: any) => u.used && u.engineer_ack === 'Pending').length;
      const mAdmAck = units.filter((u: any) => u.used && u.admin_ack === 'Acknowledged').length;
      const mAdmPending = units.filter((u: any) => u.used && u.admin_ack === 'Pending').length;

      totalQty += mTotal;
      usedQty += mUsed;
      returnedQty += mReturned;
      notReturnedQty += mNotReturned;
      engAckQty += mEngAck;
      engPendingQty += mEngPending;
      admAckQty += mAdmAck;
      admPendingQty += mAdmPending;

      return {
        material_id: m.material_id,
        material_name: matName,
        total_quantity: mTotal,
        used_quantity: mUsed,
        unused_quantity: mUnused,
        return_status_quantity: {
          returned: mReturned,
          not_returned: mNotReturned,
        },
        engineer_ack_quantity: {
          acknowledged: mEngAck,
          pending: mEngPending,
        },
        admin_ack_quantity: {
          acknowledged: mAdmAck,
          pending: mAdmPending,
        },
      };
    });

    const unusedQty = Math.max(0, totalQty - usedQty);

    return {
      total_quantity: totalQty,
      used_quantity: usedQty,
      unused_quantity: unusedQty,
      return_status_quantity: {
        returned: returnedQty,
        not_returned: notReturnedQty,
      },
      engineer_ack_quantity: {
        acknowledged: engAckQty,
        pending: engPendingQty,
      },
      admin_ack_quantity: {
        acknowledged: admAckQty,
        pending: admPendingQty,
      },
      materials_breakdown: materialsBreakdown,
    };
  }

  private async invalidateCache(id?: string) {
    const promises: Promise<any>[] = [
      this.redis.delByPrefix('stores:'),
      this.redis.delByPrefix('store:'),
    ];
    if (id) {
      promises.push(this.redis.del(`${this.CACHE_PREFIX}id:${id}`));
    }
    await Promise.all(promises);
  }
}

