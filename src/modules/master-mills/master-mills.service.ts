import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { Prisma } from '@prisma/client';
import { CreateMasterMillDto } from './dto/create-master-mill.dto';
import { UpdateMasterMillDto } from './dto/update-master-mill.dto';
import { QuickRegisterDto } from './dto/quick-register.dto';

@Injectable()
export class MasterMillsService {
  private readonly CACHE_PREFIX = 'master_mill:';
  private readonly LIST_CACHE_KEY = 'master_mills:list:';

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.MasterMillWhereInput;
    orderBy?: Prisma.MasterMillOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params;

    const cacheKey = `${this.LIST_CACHE_KEY}${JSON.stringify(params)}`;
    const cachedData = await this.redis.getJson<any>(cacheKey);
    if (cachedData) return cachedData;

    const [masterMills, total] = await Promise.all([
      this.prisma.masterMill.findMany({
        skip,
        take,
        where: { ...where, deleted_at: null },
        include: {
          mill: {
            select: {
              id: true,
              name: true,
              ref_no: true,
              place: true,
              phone: true,
              customer_id: true,
              customer: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy,
      }),
      this.prisma.masterMill.count({ where: { ...where, deleted_at: null } }),
    ]);

    const result = { masterMills, total };
    await this.redis.setJson(cacheKey, result, 300);
    return result;
  }

  async findById(id: string) {
    const cacheKey = `${this.CACHE_PREFIX}id:${id}`;
    const cached = await this.redis.getJson<any>(cacheKey);
    if (cached) return cached;

    const masterMill = await this.prisma.masterMill.findFirst({
      where: { id, deleted_at: null },
      include: {
        mill: {
          select: {
            id: true,
            name: true,
            ref_no: true,
            place: true,
            phone: true,
            customer_id: true,
            customer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!masterMill)
      throw new NotFoundException('Master Mill record not found');
    await this.redis.setJson(cacheKey, masterMill, 3600);
    return masterMill;
  }

  async create(dto: CreateMasterMillDto) {
    const cleanFrameNo = dto.frame_no?.trim();
    const cleanRefNo = dto.ref_no?.trim();

    if (cleanFrameNo || cleanRefNo) {
      const orConditions: Prisma.MasterMillWhereInput[] = [];
      if (cleanFrameNo) orConditions.push({ frame_no: cleanFrameNo });
      if (cleanRefNo) orConditions.push({ ref_no: cleanRefNo });

      const existing = await this.prisma.masterMill.findFirst({
        where: {
          deleted_at: null,
          OR: orConditions,
        },
      });

      if (existing) {
        return existing;
      }
    }

    const data: any = { ...dto };

    // Auto-calculate warranty_closing_date if not supplied
    if (!data.warranty_closing_date && data.installation_date) {
      const installDate = new Date(data.installation_date);
      const years = data.warranty_years ?? 0;
      const months = data.warranty_months ?? 0;
      installDate.setFullYear(installDate.getFullYear() + years);
      installDate.setMonth(installDate.getMonth() + months);
      data.warranty_closing_date = installDate.toISOString();
    }

    // Auto-calculate amc_closing_date if not supplied
    if (!data.amc_closing_date && data.amc_starting_date && data.amc_period) {
      const amcStart = new Date(data.amc_starting_date);
      amcStart.setMonth(amcStart.getMonth() + data.amc_period);
      data.amc_closing_date = amcStart.toISOString();
    }

    // Convert date strings to Date objects for Prisma
    if (data.invoice_date) data.invoice_date = new Date(data.invoice_date);
    if (data.installation_date)
      data.installation_date = new Date(data.installation_date);
    if (data.warranty_closing_date)
      data.warranty_closing_date = new Date(data.warranty_closing_date);
    if (data.amc_starting_date)
      data.amc_starting_date = new Date(data.amc_starting_date);
    if (data.amc_closing_date)
      data.amc_closing_date = new Date(data.amc_closing_date);

    const masterMill = await this.prisma.masterMill.create({ data });
    await this.invalidateCache();
    return masterMill;
  }

  async update(id: string, dto: UpdateMasterMillDto) {
    const existing = await this.prisma.masterMill.findFirst({
      where: { id, deleted_at: null },
    });
    if (!existing) throw new NotFoundException('Master Mill record not found');

    const data: any = { ...dto };

    // Re-calculate warranty_closing_date if relevant fields change and not overridden
    const installDate = data.installation_date
      ? new Date(data.installation_date)
      : existing.installation_date
        ? new Date(existing.installation_date)
        : null;

    if (installDate && !data.warranty_closing_date) {
      const years = data.warranty_years ?? existing.warranty_years ?? 0;
      const months = data.warranty_months ?? existing.warranty_months ?? 0;
      const closing = new Date(installDate);
      closing.setFullYear(closing.getFullYear() + years);
      closing.setMonth(closing.getMonth() + months);
      data.warranty_closing_date = closing.toISOString();
    }

    // Re-calculate amc_closing_date if relevant fields change
    const amcStart = data.amc_starting_date
      ? new Date(data.amc_starting_date)
      : existing.amc_starting_date
        ? new Date(existing.amc_starting_date)
        : null;
    const amcPeriod = data.amc_period ?? existing.amc_period;

    if (amcStart && amcPeriod && !data.amc_closing_date) {
      const amcClose = new Date(amcStart);
      amcClose.setMonth(amcClose.getMonth() + amcPeriod);
      data.amc_closing_date = amcClose.toISOString();
    }

    // Convert date strings to Date objects for Prisma
    if (data.invoice_date) data.invoice_date = new Date(data.invoice_date);
    if (data.installation_date)
      data.installation_date = new Date(data.installation_date);
    if (data.warranty_closing_date)
      data.warranty_closing_date = new Date(data.warranty_closing_date);
    if (data.amc_starting_date)
      data.amc_starting_date = new Date(data.amc_starting_date);
    if (data.amc_closing_date)
      data.amc_closing_date = new Date(data.amc_closing_date);

    const updated = await this.prisma.masterMill.update({
      where: { id },
      data,
    });

    await this.invalidateCache(id);
    return { before: existing, after: updated };
  }

  async remove(id: string) {
    const existing = await this.prisma.masterMill.findFirst({
      where: { id, deleted_at: null },
    });
    if (!existing) throw new NotFoundException('Master Mill record not found');

    const deleted = await this.prisma.masterMill.update({
      where: { id },
      data: { deleted_at: new Date(), status: 'DELETED' },
    });

    await this.invalidateCache(id);
    return deleted;
  }

  async getStats() {
    const cacheKey = `${this.LIST_CACHE_KEY}stats`;
    const cached = await this.redis.getJson<any>(cacheKey);
    if (cached) return cached;

    const now = new Date();

    const [
      total,
      underWarranty,
      underAmc,
      nonWarranty,
      installationCount,
      serviceCount,
    ] = await Promise.all([
      this.prisma.masterMill.count({ where: { deleted_at: null } }),
      this.prisma.masterMill.count({
        where: {
          deleted_at: null,
          all_warranty: 'Under Warranty',
        },
      }),
      this.prisma.masterMill.count({
        where: {
          deleted_at: null,
          all_warranty: 'Under AMC',
        },
      }),
      this.prisma.masterMill.count({
        where: { deleted_at: null, all_warranty: 'Non Warranty' },
      }),
      this.prisma.masterMill.count({
        where: { deleted_at: null, type: 'Installation' },
      }),
      this.prisma.masterMill.count({
        where: { deleted_at: null, type: 'Service' },
      }),
    ]);

    const result = {
      total,
      underWarranty,
      underAmc,
      nonWarranty,
      installationCount,
      serviceCount,
    };
    await this.redis.setJson(cacheKey, result, 120);
    return result;
  }

  async findForPrefill(search?: string, refNo?: string, frameNo?: string) {
    if (!search && !refNo && !frameNo) {
      return [];
    }

    const where: Prisma.MasterMillWhereInput = {
      deleted_at: null,
      status: 'ACTIVE',
    };

    if (search) {
      const cleanSearch = search.trim();
      where.OR = [
        { ref_no: { contains: cleanSearch, mode: 'insensitive' } },
        { frame_no: { contains: cleanSearch, mode: 'insensitive' } },
        { mill: { name: { contains: cleanSearch, mode: 'insensitive' } } },
        {
          mill: {
            customer: { name: { contains: cleanSearch, mode: 'insensitive' } },
          },
        },
      ];
    } else {
      const orConditions: Prisma.MasterMillWhereInput[] = [];
      if (refNo) {
        orConditions.push({
          ref_no: { contains: refNo.trim(), mode: 'insensitive' },
        });
      }
      if (frameNo) {
        orConditions.push({
          frame_no: { contains: frameNo.trim(), mode: 'insensitive' },
        });
      }
      if (orConditions.length > 0) {
        where.OR = orConditions;
      }
    }

    return this.prisma.masterMill.findMany({
      where,
      include: {
        mill: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
      take: 10,
    });
  }

  async quickRegister(dto: QuickRegisterDto) {
    const customerIdInput = dto.customer_id?.trim();
    const customerNameInput = dto.customer_name?.trim();

    if (!customerIdInput && !customerNameInput) {
      throw new BadRequestException(
        'Either customer_id or customer_name must be provided',
      );
    }

    const cleanMillName = dto.mill_name.trim();
    const cleanRefNo = dto.ref_no.trim();
    const cleanFrameNo = dto.frame_no?.trim();
    const cleanMcModel = dto.mc_model?.trim();
    const cleanAddress = dto.address?.trim();
    const cleanPlace = dto.place.trim();
    const cleanState = dto.state?.trim();
    const cleanPhone = dto.phone?.trim();
    const cleanEmail = dto.email?.trim();

    // Run lookups, updates, and creation inside a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Resolve & Update Customer
      let customer = null;
      if (customerIdInput) {
        customer = await tx.customer.findFirst({
          where: { id: customerIdInput, deleted_at: null },
        });
        if (!customer) {
          throw new BadRequestException('Provided Customer ID does not exist');
        }

        // Checklist 1: Update customer fields if provided and empty/different
        const customerUpdates: any = {};
        if (cleanAddress && customer.address !== cleanAddress)
          customerUpdates.address = cleanAddress;
        if (cleanPhone && customer.phone !== cleanPhone)
          customerUpdates.phone = cleanPhone;
        if (cleanEmail && customer.email !== cleanEmail)
          customerUpdates.email = cleanEmail;

        if (Object.keys(customerUpdates).length > 0) {
          customer = await tx.customer.update({
            where: { id: customer.id },
            data: customerUpdates,
          });
        }
      } else {
        const cleanCustName = customerNameInput!;
        // Find existing by name (case-insensitive)
        customer = await tx.customer.findFirst({
          where: {
            name: { equals: cleanCustName, mode: 'insensitive' },
            deleted_at: null,
          },
        });

        if (customer) {
          // Checklist 1: Update customer fields if provided and empty/different
          const customerUpdates: any = {};
          if (cleanAddress && customer.address !== cleanAddress)
            customerUpdates.address = cleanAddress;
          if (cleanPhone && customer.phone !== cleanPhone)
            customerUpdates.phone = cleanPhone;
          if (cleanEmail && customer.email !== cleanEmail)
            customerUpdates.email = cleanEmail;

          if (Object.keys(customerUpdates).length > 0) {
            customer = await tx.customer.update({
              where: { id: customer.id },
              data: customerUpdates,
            });
          }
        } else {
          // Create customer
          customer = await tx.customer.create({
            data: {
              name: cleanCustName,
              address: cleanAddress,
              phone: cleanPhone,
              email: cleanEmail,
              status: 'ACTIVE',
            },
          });
        }
      }

      const resolvedCustomerId = customer.id;

      // 2. Resolve & Update Mill
      let mill = await tx.mill.findFirst({
        where: {
          name: { equals: cleanMillName, mode: 'insensitive' },
          customer_id: resolvedCustomerId,
          deleted_at: null,
        },
      });

      if (mill) {
        // Checklist 2: Update mill fields if provided and empty/different
        const millUpdates: any = {};
        if (cleanAddress && mill.address !== cleanAddress)
          millUpdates.address = cleanAddress;
        if (cleanPhone && mill.phone !== cleanPhone)
          millUpdates.phone = cleanPhone;
        if (cleanEmail && mill.email !== cleanEmail)
          millUpdates.email = cleanEmail;
        if (cleanPlace && mill.place !== cleanPlace)
          millUpdates.place = cleanPlace;
        if (cleanRefNo && mill.ref_no !== cleanRefNo)
          millUpdates.ref_no = cleanRefNo;

        if (Object.keys(millUpdates).length > 0) {
          mill = await tx.mill.update({
            where: { id: mill.id },
            data: millUpdates,
          });
        }
      } else {
        // Create new mill
        mill = await tx.mill.create({
          data: {
            name: cleanMillName,
            customer_id: resolvedCustomerId,
            address: cleanAddress,
            phone: cleanPhone,
            place: cleanPlace,
            ref_no: cleanRefNo,
            email: cleanEmail,
            status: 'ACTIVE',
          },
        });
      }

      const resolvedMillId = mill.id;

      // 3. Resolve & Update Master Mill
      const orConditions: Prisma.MasterMillWhereInput[] = [
        { ref_no: { equals: cleanRefNo, mode: 'insensitive' } },
      ];
      if (cleanFrameNo) {
        orConditions.push({
          frame_no: { equals: cleanFrameNo, mode: 'insensitive' },
        });
      }

      let masterMill = await tx.masterMill.findFirst({
        where: {
          deleted_at: null,
          OR: orConditions,
        },
      });

      if (masterMill) {
        // Checklist 3: Update master mill fields if provided and empty/different
        const masterMillUpdates: any = {};
        if (cleanRefNo && masterMill.ref_no !== cleanRefNo)
          masterMillUpdates.ref_no = cleanRefNo;
        if (cleanFrameNo && masterMill.frame_no !== cleanFrameNo)
          masterMillUpdates.frame_no = cleanFrameNo;
        if (cleanMcModel && masterMill.mc_model !== cleanMcModel)
          masterMillUpdates.mc_model = cleanMcModel;
        if (cleanAddress && masterMill.address !== cleanAddress)
          masterMillUpdates.address = cleanAddress;
        if (cleanPlace && masterMill.place !== cleanPlace)
          masterMillUpdates.place = cleanPlace;
        if (cleanState && masterMill.state !== cleanState)
          masterMillUpdates.state = cleanState;
        if (cleanPhone && masterMill.phone_no !== cleanPhone)
          masterMillUpdates.phone_no = cleanPhone;

        // Ensure the Master Mill is linked to the resolved Mill
        if (masterMill.mill_id !== resolvedMillId)
          masterMillUpdates.mill_id = resolvedMillId;

        if (Object.keys(masterMillUpdates).length > 0) {
          masterMill = await tx.masterMill.update({
            where: { id: masterMill.id },
            data: masterMillUpdates,
          });
        }
      } else {
        // Create new Master Mill
        // Generate a fallback invoice number (e.g. INV-QR-<refNo>-<timestamp>)
        const fallbackInvoiceNo = `INV-QR-${cleanRefNo}-${Date.now()}`;
        masterMill = await tx.masterMill.create({
          data: {
            invoice_no: fallbackInvoiceNo,
            ref_no: cleanRefNo,
            frame_no: cleanFrameNo,
            mc_model: cleanMcModel,
            address: cleanAddress,
            place: cleanPlace,
            state: cleanState,
            phone_no: cleanPhone,
            mill_id: resolvedMillId,
            status: 'ACTIVE',
            type: 'Installation',
          },
        });
      }

      // Fetch the complete record with nested mill and customer
      return tx.masterMill.findUnique({
        where: { id: masterMill.id },
        include: {
          mill: {
            include: {
              customer: true,
            },
          },
        },
      });
    });

    // Invalidate all related redis caches
    await this.invalidateAllRelatedCaches(
      result?.mill?.customer_id ?? undefined,
      result?.mill_id ?? undefined,
      result?.id ?? undefined,
    );

    return result;
  }

  private async invalidateAllRelatedCaches(
    customerId?: string,
    millId?: string,
    masterMillId?: string,
  ) {
    const promises: Promise<any>[] = [
      this.redis.delByPrefix('customers:list:'),
      this.redis.delByPrefix('mills:list:'),
      this.redis.delByPrefix('master_mills:list:'),
    ];
    if (customerId) promises.push(this.redis.del(`customer:id:${customerId}`));
    if (millId) promises.push(this.redis.del(`mill:id:${millId}`));
    if (masterMillId)
      promises.push(this.redis.del(`${this.CACHE_PREFIX}id:${masterMillId}`));
    await Promise.all(promises);
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
