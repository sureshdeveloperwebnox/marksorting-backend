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

    await this.prisma.masterMill.create({ data });
    await this.invalidateCache();

    // Re-fetch with mill relation so the response shape matches findAll/findById
    const created = await this.prisma.masterMill.findFirst({
      where: { invoice_no: data.invoice_no, deleted_at: null },
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
    return created;
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

    const cleanInvoiceNo = dto.invoice_no?.trim();
    const invoiceDate = dto.invoice_date ? new Date(dto.invoice_date) : null;
    const installationDate = dto.installation_date ? new Date(dto.installation_date) : null;
    const warrantyYears = dto.warranty_years !== undefined ? Number(dto.warranty_years) : 1;
    const warrantyMonths = dto.warranty_months !== undefined ? Number(dto.warranty_months) : 12;
    const amcStartingDate = dto.amc_starting_date ? new Date(dto.amc_starting_date) : null;
    let amcClosingDate = dto.amc_closing_date ? new Date(dto.amc_closing_date) : null;
    const amcPeriod = dto.amc_period !== undefined && dto.amc_period !== null ? Number(dto.amc_period) : null;
    const amcAmount = dto.amc_amount !== undefined && dto.amc_amount !== null ? Number(dto.amc_amount) : null;
    const amcParticulars = dto.amc_particulars?.trim();

    // Auto-calculate warranty closing date if installation date is provided
    let warrantyClosingDate: Date | null = null;
    if (installationDate) {
      const closing = new Date(installationDate);
      closing.setFullYear(closing.getFullYear() + warrantyYears);
      closing.setMonth(closing.getMonth() + warrantyMonths);
      warrantyClosingDate = closing;
    }

    // Auto-calculate AMC closing date if AMC starting date and period are provided
    if (!amcClosingDate && amcStartingDate && amcPeriod) {
      const closing = new Date(amcStartingDate);
      closing.setMonth(closing.getMonth() + amcPeriod);
      amcClosingDate = closing;
    }

    // Determine warranty status dynamically
    let allWarranty = 'Non Warranty';
    const now = new Date();
    if (warrantyClosingDate && warrantyClosingDate > now) {
      allWarranty = 'Under Warranty';
    } else if (amcClosingDate && amcClosingDate > now) {
      allWarranty = 'Under AMC';
    }

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
      // Match by mill_id AND (ref_no OR frame_no) to prevent cross-mill matching
      const orConditions: Prisma.MasterMillWhereInput[] = [];
      if (cleanRefNo) {
        orConditions.push({
          ref_no: { equals: cleanRefNo, mode: 'insensitive' },
        });
      }
      if (cleanFrameNo) {
        orConditions.push({
          frame_no: { equals: cleanFrameNo, mode: 'insensitive' },
        });
      }

      let masterMill = await tx.masterMill.findFirst({
        where: {
          deleted_at: null,
          mill_id: resolvedMillId,
          OR: orConditions.length > 0 ? orConditions : undefined,
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
        if (dto.type && masterMill.type !== dto.type)
          masterMillUpdates.type = dto.type;

        // Bulk upload extra fields:
        if (cleanInvoiceNo && masterMill.invoice_no !== cleanInvoiceNo)
          masterMillUpdates.invoice_no = cleanInvoiceNo;
        if (invoiceDate && masterMill.invoice_date?.getTime() !== invoiceDate.getTime())
          masterMillUpdates.invoice_date = invoiceDate;
        if (installationDate && masterMill.installation_date?.getTime() !== installationDate.getTime())
          masterMillUpdates.installation_date = installationDate;
        if (dto.warranty_years !== undefined && masterMill.warranty_years !== warrantyYears)
          masterMillUpdates.warranty_years = warrantyYears;
        if (dto.warranty_months !== undefined && masterMill.warranty_months !== warrantyMonths)
          masterMillUpdates.warranty_months = warrantyMonths;
        if (warrantyClosingDate && masterMill.warranty_closing_date?.getTime() !== warrantyClosingDate.getTime())
          masterMillUpdates.warranty_closing_date = warrantyClosingDate;
        if (amcStartingDate && masterMill.amc_starting_date?.getTime() !== amcStartingDate.getTime())
          masterMillUpdates.amc_starting_date = amcStartingDate;
        if (amcClosingDate && masterMill.amc_closing_date?.getTime() !== amcClosingDate.getTime())
          masterMillUpdates.amc_closing_date = amcClosingDate;
        if (amcPeriod !== null && masterMill.amc_period !== amcPeriod)
          masterMillUpdates.amc_period = amcPeriod;
        if (amcAmount !== null && masterMill.amc_amount?.toString() !== amcAmount?.toString())
          masterMillUpdates.amc_amount = amcAmount;
        if (amcParticulars && masterMill.amc_particular !== amcParticulars)
          masterMillUpdates.amc_particular = amcParticulars;
        if (allWarranty && masterMill.all_warranty !== allWarranty)
          masterMillUpdates.all_warranty = allWarranty;

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
        const invoiceNo = cleanInvoiceNo || `INV-QR-${cleanRefNo}-${Date.now()}`;
        masterMill = await tx.masterMill.create({
          data: {
            invoice_no: invoiceNo,
            invoice_date: invoiceDate,
            ref_no: cleanRefNo,
            frame_no: cleanFrameNo,
            mc_model: cleanMcModel,
            address: cleanAddress,
            place: cleanPlace,
            state: cleanState,
            phone_no: cleanPhone,
            mill_id: resolvedMillId,
            status: 'ACTIVE',
            type: dto.type || 'Installation',
            installation_date: installationDate,
            warranty_years: warrantyYears,
            warranty_months: warrantyMonths,
            warranty_closing_date: warrantyClosingDate,
            amc_starting_date: amcStartingDate,
            amc_closing_date: amcClosingDate,
            amc_period: amcPeriod,
            amc_amount: amcAmount,
            amc_particular: amcParticulars,
            all_warranty: allWarranty,
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

  /**
   * Synchronises the MasterMill registry after a ServiceReport is created or
   * updated.  If no matching record exists (by frame_no or mill_id), a new one
   * is created with type = 'Service'.  If one already exists, its machine
   * details are updated to reflect the latest service data.
   *
   * Called fire-and-forget from ServiceReportsService so that failures here
   * never break the service-report creation flow.
   */
  async syncFromServiceReport(params: {
    millId: string;
    frameNo?: string;
    mcModel?: string;
    installationDate?: Date | null;
    place?: string;
  }): Promise<void> {
    try {
      const { millId, frameNo, mcModel, installationDate, place } = params;

      // Fetch mill with customer for address / ref_no data
      const mill = await this.prisma.mill.findUnique({
        where: { id: millId },
        include: { customer: true },
      });

      if (!mill) return;

      // Find an existing master-mill record for this mill
      const existing = await this.prisma.masterMill.findFirst({
        where: {
          deleted_at: null,
          type: 'Service',
          mill_id: millId,
        },
      });

      if (existing) {
        // Update fields that are empty or differ
        const updates: Record<string, any> = {};
        if (frameNo && frameNo.trim() && existing.frame_no !== frameNo.trim())
          updates.frame_no = frameNo.trim();
        if (mcModel && mcModel.trim() && existing.mc_model !== mcModel.trim())
          updates.mc_model = mcModel.trim();
        if (installationDate && !existing.installation_date)
          updates.installation_date = installationDate;
        if (place && place.trim() && existing.place !== place.trim())
          updates.place = place.trim();
        if (existing.mill_id !== millId) updates.mill_id = millId;
        // Only flip type to 'Service' if it hasn't already been set to 'Installation'
        if (existing.type !== 'Installation') updates.type = 'Service';

        if (Object.keys(updates).length > 0) {
          await this.prisma.masterMill.update({
            where: { id: existing.id },
            data: updates,
          });
        }
      } else {
        // Create a new record with type = 'Service'
        const fallbackInvoiceNo = `INV-SR-${mill.ref_no || millId.slice(0, 8)}-${Date.now()}`;
        await this.prisma.masterMill.create({
          data: {
            invoice_no: fallbackInvoiceNo,
            ref_no: mill.ref_no || undefined,
            frame_no: frameNo?.trim() || undefined,
            mc_model: mcModel?.trim() || undefined,
            installation_date: installationDate || undefined,
            address: mill.address || undefined,
            place: place?.trim() || mill.place || undefined,
            phone_no: mill.phone || undefined,
            mill_id: millId,
            status: 'ACTIVE',
            type: 'Service',
          },
        });
      }

      // Invalidate master-mills list cache
      await this.redis.delByPrefix(this.LIST_CACHE_KEY);
    } catch (error) {
      console.error('Error in syncFromServiceReport:', error);
      // Fire-and-forget — swallow errors so service report creation is unaffected
    }
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
