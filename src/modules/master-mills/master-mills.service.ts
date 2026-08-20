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
    if (data.phone_no) {
      data.phone_no = this.formatPhoneNumber(data.phone_no);
    }
    if (data.frame_no !== undefined) data.frame_no = data.frame_no || null;
    if (data.ref_no !== undefined) data.ref_no = data.ref_no || null;
    if (data.mill_id !== undefined) data.mill_id = data.mill_id || null;
    if (data.mc_model !== undefined) data.mc_model = data.mc_model || null;
    if (data.address !== undefined) data.address = data.address || null;
    if (data.place !== undefined) data.place = data.place || null;
    if (data.state !== undefined) data.state = data.state || null;
    if (data.amc_particular !== undefined) data.amc_particular = data.amc_particular || null;

    // Auto-calculate warranty_closing_date if not supplied
    if (!data.warranty_closing_date) {
      const baseDate = data.warranty_start_date
        ? new Date(data.warranty_start_date)
        : data.installation_date
          ? new Date(data.installation_date)
          : null;
      if (baseDate) {
        const years = data.warranty_years ?? 0;
        const months = data.warranty_months ?? 0;
        const totalMonths = months + years * 12;
        baseDate.setMonth(baseDate.getMonth() + (totalMonths > 0 ? totalMonths : 12));
        baseDate.setDate(baseDate.getDate() - 1);
        data.warranty_closing_date = baseDate.toISOString();
      }
    }

    // Auto-calculate or clear amc_closing_date based on amc_starting_date
    if (!data.amc_starting_date) {
      data.amc_closing_date = null as any;
    } else if (data.amc_starting_date && data.amc_period) {
      const amcStart = new Date(data.amc_starting_date);
      amcStart.setMonth(amcStart.getMonth() + data.amc_period);
      amcStart.setDate(amcStart.getDate() - 1);
      data.amc_closing_date = amcStart.toISOString();
    }

    // Determine warranty status dynamically
    let allWarranty = 'Non Warranty';
    const now = new Date();
    const warrantyClose = data.warranty_closing_date ? new Date(data.warranty_closing_date) : null;
    const amcClose = data.amc_closing_date ? new Date(data.amc_closing_date) : null;
    if (warrantyClose && warrantyClose > now) {
      allWarranty = 'Under Warranty';
    } else if (amcClose && amcClose > now) {
      allWarranty = 'Under AMC';
    } else if (warrantyClose || amcClose) {
      allWarranty = 'Expired';
    }
    data.all_warranty = allWarranty;

    // Convert date strings to Date objects for Prisma
    if (data.mfg_date) data.mfg_date = new Date(data.mfg_date);
    if (data.invoice_date) data.invoice_date = new Date(data.invoice_date);
    if (data.installation_date)
      data.installation_date = new Date(data.installation_date);
    if (data.warranty_start_date)
      data.warranty_start_date = new Date(data.warranty_start_date);
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

    const data: any = {};

    // String fields - set to null if empty string or null in dto
    if (dto.invoice_no !== undefined) data.invoice_no = dto.invoice_no;
    if (dto.ref_no !== undefined) data.ref_no = dto.ref_no || null;
    if (dto.mill_id !== undefined) data.mill_id = dto.mill_id || null;
    if (dto.address !== undefined) data.address = dto.address || null;
    if (dto.place !== undefined) data.place = dto.place || null;
    if (dto.state !== undefined) data.state = dto.state || null;
    if (dto.phone_no !== undefined) {
      data.phone_no = dto.phone_no ? this.formatPhoneNumber(dto.phone_no) || null : null;
    }
    if (dto.mc_model !== undefined) data.mc_model = dto.mc_model || null;
    if (dto.frame_no !== undefined) data.frame_no = dto.frame_no || null;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.warranty_years !== undefined) data.warranty_years = dto.warranty_years ?? 0;
    if (dto.warranty_months !== undefined) data.warranty_months = dto.warranty_months ?? 0;
    if (dto.amc_particular !== undefined) data.amc_particular = dto.amc_particular || null;

    if (dto.amc_period !== undefined) {
      data.amc_period =
        dto.amc_period !== null && dto.amc_period !== undefined && !isNaN(Number(dto.amc_period))
          ? Number(dto.amc_period)
          : null;
    }
    if (dto.amc_amount !== undefined) {
      data.amc_amount =
        dto.amc_amount !== null && dto.amc_amount !== undefined && !isNaN(Number(dto.amc_amount))
          ? Number(dto.amc_amount)
          : null;
    }

    // Date fields - parse to Date object or set to null
    if (dto.mfg_date !== undefined) {
      data.mfg_date = dto.mfg_date ? new Date(dto.mfg_date) : null;
    }
    if (dto.invoice_date !== undefined) {
      data.invoice_date = dto.invoice_date ? new Date(dto.invoice_date) : null;
    }
    if (dto.installation_date !== undefined) {
      data.installation_date = dto.installation_date ? new Date(dto.installation_date) : null;
    }
    if (dto.warranty_start_date !== undefined) {
      data.warranty_start_date = dto.warranty_start_date ? new Date(dto.warranty_start_date) : null;
    }
    if (dto.warranty_closing_date !== undefined) {
      data.warranty_closing_date = dto.warranty_closing_date ? new Date(dto.warranty_closing_date) : null;
    }
    if (dto.amc_starting_date !== undefined) {
      data.amc_starting_date = dto.amc_starting_date ? new Date(dto.amc_starting_date) : null;
    }
    if (dto.amc_closing_date !== undefined) {
      data.amc_closing_date = dto.amc_closing_date ? new Date(dto.amc_closing_date) : null;
    }

    // Re-calculate warranty_closing_date if relevant fields change and not explicitly overridden
    const installDate = data.installation_date !== undefined
      ? data.installation_date
      : existing.installation_date;

    const startOfWarranty = data.warranty_start_date !== undefined
      ? data.warranty_start_date
      : existing.warranty_start_date;

    const baseDate = startOfWarranty || installDate;

    if (baseDate && data.warranty_closing_date === undefined) {
      const years = data.warranty_years ?? existing.warranty_years ?? 0;
      const months = data.warranty_months ?? existing.warranty_months ?? 0;
      const totalMonths = months + years * 12;
      const closing = new Date(baseDate);
      closing.setMonth(closing.getMonth() + (totalMonths > 0 ? totalMonths : 12));
      closing.setDate(closing.getDate() - 1);
      data.warranty_closing_date = closing;
    }

    // Re-calculate or clear amc_closing_date if relevant fields change
    const amcStart = data.amc_starting_date !== undefined
      ? data.amc_starting_date
      : existing.amc_starting_date;
    const amcPeriod = data.amc_period !== undefined
      ? data.amc_period
      : existing.amc_period;

    if (!amcStart) {
      data.amc_closing_date = null;
    } else if (amcStart && amcPeriod && data.amc_closing_date === undefined) {
      const amcClose = new Date(amcStart);
      amcClose.setMonth(amcClose.getMonth() + amcPeriod);
      amcClose.setDate(amcClose.getDate() - 1);
      data.amc_closing_date = amcClose;
    }

    // Determine warranty status dynamically
    let allWarranty = 'Non Warranty';
    const now = new Date();
    const warrantyClose = data.warranty_closing_date !== undefined
      ? data.warranty_closing_date
      : existing.warranty_closing_date;
    const amcClose = data.amc_closing_date !== undefined
      ? data.amc_closing_date
      : existing.amc_closing_date;

    if (warrantyClose && new Date(warrantyClose) > now) {
      allWarranty = 'Under Warranty';
    } else if (amcClose && new Date(amcClose) > now) {
      allWarranty = 'Under AMC';
    } else if (warrantyClose || amcClose) {
      allWarranty = 'Expired';
    }
    data.all_warranty = allWarranty;

    const updated = await this.prisma.masterMill.update({
      where: { id },
      data,
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
    ]);

    const result = {
      total,
      underWarranty,
      underAmc,
      nonWarranty,
    };
    await this.redis.setJson(cacheKey, result, 120);
    return result;
  }

  async findForPrefill(
    search?: string,
    refNo?: string,
    frameNo?: string,
    context?: 'service_report' | 'installation_report',
  ): Promise<any[] | { serviceBased: any[]; installationBased: any[]; }> {
    if (!search && !refNo && !frameNo) {
      return context ? { serviceBased: [], installationBased: [] } : [];
    }

    const cleanSearch = search ? search.trim() : '';
    const cleanRefNo = refNo ? refNo.trim() : '';
    const cleanFrameNo = frameNo ? frameNo.trim() : '';

    // 1. Fetch from MasterMill (no type filter — all records are visible to both workflows)
    let masterMills: any[] = [];
    {
      const mmWhere: Prisma.MasterMillWhereInput = {
        deleted_at: null,
        status: 'ACTIVE',
      };

      if (cleanSearch) {
        mmWhere.OR = [
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
        if (cleanRefNo) {
          orConditions.push({
            ref_no: { contains: cleanRefNo, mode: 'insensitive' },
          });
        }
        if (cleanFrameNo) {
          orConditions.push({
            frame_no: { contains: cleanFrameNo, mode: 'insensitive' },
          });
        }
        if (orConditions.length > 0) {
          mmWhere.OR = orConditions;
        }
      }

      masterMills = await this.prisma.masterMill.findMany({
        where: mmWhere,
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
        take: 15,
      });
    }

    // 2. Fetch from ServiceReport
    let serviceReports: any[] = [];
    if (!context || context === 'service_report') {
      const srWhere: Prisma.ServiceReportWhereInput = {
        deleted_at: null,
      };
      if (cleanSearch) {
        srWhere.OR = [
          { serial_or_frame_no: { contains: cleanSearch, mode: 'insensitive' } },
          { machine_model: { contains: cleanSearch, mode: 'insensitive' } },
          { mill: { name: { contains: cleanSearch, mode: 'insensitive' } } },
          {
            mill: {
              customer: { name: { contains: cleanSearch, mode: 'insensitive' } },
            },
          },
        ];
      } else {
        const orConditions: Prisma.ServiceReportWhereInput[] = [];
        if (cleanFrameNo) {
          orConditions.push({
            serial_or_frame_no: { contains: cleanFrameNo, mode: 'insensitive' },
          });
        }
        if (orConditions.length > 0) {
          srWhere.OR = orConditions;
        }
      }

      serviceReports = await this.prisma.serviceReport.findMany({
        where: srWhere,
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
        take: 15,
      });
    }

    // 3. Fetch from InstallationReport
    let installationReports: any[] = [];
    if (!context || context === 'installation_report') {
      const irWhere: Prisma.InstallationReportWhereInput = {
        deleted_at: null,
      };
      if (cleanSearch) {
        irWhere.OR = [
          { serial_or_frame_no: { contains: cleanSearch, mode: 'insensitive' } },
          { machine_model: { contains: cleanSearch, mode: 'insensitive' } },
          { mill: { name: { contains: cleanSearch, mode: 'insensitive' } } },
          {
            mill: {
              customer: { name: { contains: cleanSearch, mode: 'insensitive' } },
            },
          },
        ];
      } else {
        const orConditions: Prisma.InstallationReportWhereInput[] = [];
        if (cleanFrameNo) {
          orConditions.push({
            serial_or_frame_no: { contains: cleanFrameNo, mode: 'insensitive' },
          });
        }
        if (orConditions.length > 0) {
          irWhere.OR = orConditions;
        }
      }

      installationReports = await this.prisma.installationReport.findMany({
        where: irWhere,
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
        take: 15,
      });
    }

    // Mapping Helpers
    const mapMasterMill = (record: any) => ({
      id: record.id,
      invoice_no: record.invoice_no,
      invoice_date: record.invoice_date,
      ref_no: record.ref_no,
      mill_id: record.mill_id,
      address: record.address,
      place: record.place,
      state: record.state,
      phone_no: record.phone_no,
      mc_model: record.mc_model,
      frame_no: record.frame_no,
      warranty_years: record.warranty_years,
      warranty_months: record.warranty_months,
      installation_date: record.installation_date,
      warranty_start_date: record.warranty_start_date || record.installation_date,
      warranty_closing_date: (record.warranty_start_date || record.installation_date) ? record.warranty_closing_date : null,
      all_warranty: record.all_warranty,
      amc_starting_date: record.amc_starting_date,
      amc_period: record.amc_period,
      amc_particular: record.amc_particular,
      amc_closing_date: record.amc_starting_date ? record.amc_closing_date : null,
      amc_amount: record.amc_amount,
      status: record.status,
      mfg_date: record.mfg_date,
      mill: record.mill ? {
        id: record.mill.id,
        name: record.mill.name,
        place: record.mill.place,
        phone: record.mill.phone,
        email: record.mill.email,
        customer_id: record.mill.customer_id,
        customer: record.mill.customer ? {
          id: record.mill.customer.id,
          name: record.mill.customer.name,
          email: record.mill.customer.email,
          phone: record.mill.customer.phone,
        } : null,
      } : null,
    });

    const mapServiceReport = (record: any) => ({
      id: `sr-${record.id}`,
      invoice_no: '',
      invoice_date: null,
      ref_no: record.mill?.ref_no || null,
      mill_id: record.mill_id,
      address: record.mill?.address || null,
      place: record.place,
      state: record.mill?.state || null,
      phone_no: record.mill_whatsapp_number,
      mc_model: record.machine_model,
      frame_no: record.serial_or_frame_no,
      warranty_years: 0,
      warranty_months: 0,
      installation_date: record.machine_installation_date || record.visit_date,
      warranty_start_date: record.machine_installation_date || record.visit_date,
      warranty_closing_date: null,
      all_warranty: 'Non Warranty',
      amc_starting_date: null,
      amc_period: null,
      amc_particular: null,
      amc_closing_date: null,
      amc_amount: 0,
      status: 'ACTIVE',
      mfg_date: record.machine_mfg_date || null,
      mill: record.mill ? {
        id: record.mill.id,
        name: record.mill.name,
        place: record.mill.place,
        phone: record.mill.phone,
        email: record.mill.email,
        customer_id: record.mill.customer_id,
        customer: record.mill.customer ? {
          id: record.mill.customer.id,
          name: record.mill.customer.name,
          email: record.mill.customer.email,
          phone: record.mill.customer.phone,
        } : null,
      } : null,
    });

    const mapInstallationReport = (record: any) => ({
      id: `ir-${record.id}`,
      invoice_no: record.invoice_number || '',
      invoice_date: record.invoice_date,
      ref_no: record.mill?.ref_no || null,
      mill_id: record.mill_id,
      address: record.mill?.address || null,
      place: record.place,
      state: record.mill?.state || null,
      phone_no: record.mill_whatsapp_number,
      mc_model: record.machine_model,
      frame_no: record.serial_or_frame_no,
      warranty_years: record.warranty_years ?? null,
      warranty_months: record.warranty_months ?? null,
      installation_date: record.visit_date,
      warranty_start_date: record.warranty_start_date,
      warranty_closing_date: record.warranty_end_date,
      all_warranty: record.warranty_end_date && new Date(record.warranty_end_date) > new Date() ? 'Under Warranty' : 'Non Warranty',
      amc_starting_date: null,
      amc_period: null,
      amc_particular: null,
      amc_closing_date: null,
      amc_amount: 0,
      status: 'ACTIVE',
      mfg_date: record.machine_mfg_date || null,
      mill: record.mill ? {
        id: record.mill.id,
        name: record.mill.name,
        place: record.mill.place,
        phone: record.mill.phone,
        email: record.mill.email,
        customer_id: record.mill.customer_id,
        customer: record.mill.customer ? {
          id: record.mill.customer.id,
          name: record.mill.customer.name,
          email: record.mill.customer.email,
          phone: record.mill.customer.phone,
        } : null,
      } : null,
    });

    // De-duplication logic
    const buildDeduplicatedList = (
      mmList: any[],
      srList: any[],
      irList: any[],
    ) => {
      const result: any[] = [];
      const seen = new Set<string>();
      
      const addToList = (items: any[]) => {
        for (const item of items) {
          if (!item.frame_no) {
            result.push(item);
            continue;
          }
          const key = item.frame_no.trim().toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            result.push(item);
          }
        }
      };

      addToList(mmList);
      addToList(srList);
      addToList(irList);
      return result;
    };

    const mappedMM = masterMills.map(mapMasterMill);
    const mappedSR = serviceReports.map(mapServiceReport);
    const mappedIR = installationReports.map(mapInstallationReport);

    if (context) {
      if (context === 'service_report') {
        return {
          serviceBased: buildDeduplicatedList(mappedMM, mappedSR, []),
          installationBased: [],
        };
      } else {
        return {
          serviceBased: [],
          installationBased: buildDeduplicatedList(mappedMM, [], mappedIR),
        };
      }
    }

    // Default backward-compatible flat list
    return buildDeduplicatedList(mappedMM, mappedSR, mappedIR).slice(0, 10);
  }

  async quickRegister(dto: QuickRegisterDto, options?: { skipDuplicateCheck?: boolean }) {
    const customerIdInput = dto.customer_id?.trim();
    const customerNameInput = dto.customer_name?.trim();

    const cleanMillName = dto.mill_name.trim();
    const cleanRefNo = dto.ref_no.trim();
    const cleanFrameNo = dto.frame_no?.trim();
    const cleanMcModel = dto.mc_model?.trim();
    const cleanAddress = dto.address?.trim();
    const cleanPlace = dto.place.trim();
    const cleanState = dto.state?.trim();
    const cleanPhone = this.formatPhoneNumber(dto.phone?.trim());
    const cleanEmail = dto.email?.trim();

    const cleanInvoiceNo = dto.invoice_no?.trim();
    const mfgDate = dto.mfg_date ? new Date(dto.mfg_date) : null;
    const invoiceDate = dto.invoice_date ? new Date(dto.invoice_date) : null;
    const installationDate = dto.installation_date ? new Date(dto.installation_date) : null;
    const warrantyStartDate = dto.warranty_start_date ? new Date(dto.warranty_start_date) : null;
    const warrantyYears = dto.warranty_years !== undefined ? Number(dto.warranty_years) : 1;
    const warrantyMonths = dto.warranty_months !== undefined ? Number(dto.warranty_months) : 0;
    const amcStartingDate = dto.amc_starting_date ? new Date(dto.amc_starting_date) : null;
    let amcClosingDate = dto.amc_closing_date ? new Date(dto.amc_closing_date) : null;
    const amcPeriod = dto.amc_period !== undefined && dto.amc_period !== null ? Number(dto.amc_period) : null;
    const amcAmount = dto.amc_amount !== undefined && dto.amc_amount !== null ? Number(dto.amc_amount) : null;
    const amcParticulars = dto.amc_particulars?.trim();

    // Auto-calculate warranty closing date if start date or installation date is provided
    let warrantyClosingDate: Date | null = null;
    const baseDateForWarranty = warrantyStartDate || installationDate;
    if (baseDateForWarranty) {
      const closing = new Date(baseDateForWarranty);
      closing.setFullYear(closing.getFullYear() + warrantyYears);
      closing.setMonth(closing.getMonth() + warrantyMonths);
      closing.setDate(closing.getDate() - 1);
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

    let isUpdate = false;
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
      } else if (customerNameInput) {
        // Find existing by name (case-insensitive)
        customer = await tx.customer.findFirst({
          where: {
            name: { equals: customerNameInput, mode: 'insensitive' },
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
              name: customerNameInput,
              address: cleanAddress,
              phone: cleanPhone,
              email: cleanEmail,
              status: 'ACTIVE',
            },
          });
        }
      }

      const resolvedCustomerId = customer ? customer.id : null;

      // 2. Resolve & Update Mill
      let mill = await tx.mill.findFirst({
        where: {
          name: { equals: cleanMillName, mode: 'insensitive' },
          ...(resolvedCustomerId ? { customer_id: resolvedCustomerId } : {}),
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

      let masterMill = null;
      if (!options?.skipDuplicateCheck) {
        masterMill = await tx.masterMill.findFirst({
          where: {
            deleted_at: null,
            mill_id: resolvedMillId,
            OR: orConditions.length > 0 ? orConditions : undefined,
          },
        });
      }

      if (masterMill) {
        isUpdate = true;
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

        // Bulk upload extra fields:
        if (cleanInvoiceNo && masterMill.invoice_no !== cleanInvoiceNo)
          masterMillUpdates.invoice_no = cleanInvoiceNo;
        if (mfgDate && masterMill.mfg_date?.getTime() !== mfgDate.getTime())
          masterMillUpdates.mfg_date = mfgDate;
        if (invoiceDate && masterMill.invoice_date?.getTime() !== invoiceDate.getTime())
          masterMillUpdates.invoice_date = invoiceDate;
        if (installationDate && masterMill.installation_date?.getTime() !== installationDate.getTime())
          masterMillUpdates.installation_date = installationDate;
        if (warrantyStartDate && masterMill.warranty_start_date?.getTime() !== warrantyStartDate.getTime())
          masterMillUpdates.warranty_start_date = warrantyStartDate;
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
            mfg_date: mfgDate,
            address: cleanAddress,
            place: cleanPlace,
            state: cleanState,
            phone_no: cleanPhone,
            mill_id: resolvedMillId,
            status: 'ACTIVE',
            installation_date: installationDate,
            warranty_start_date: warrantyStartDate,
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

    return {
      ...result,
      _isUpdate: isUpdate,
    };
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

  /**
   * Called whenever an Installation Report is created or updated.
   * Syncs machine details, invoice info, warranty, and AMC details to MasterMill.
   */
  async syncFromInstallationReport(params: {
    millId: string;
    frameNo?: string | null;
    mcModel?: string | null;
    mfgDate?: Date | null;
    installationDate?: Date | null;
    invoiceNo?: string | null;
    invoiceDate?: Date | null;
    warrantyYears?: number | null;
    warrantyMonths?: number | null;
    warrantyStartDate?: Date | null;
    warrantyClosingDate?: Date | null;
    amcStartingDate?: Date | null;
    amcClosingDate?: Date | null;
    amcPeriod?: number | null;
    amcParticular?: string | null;
    amcAmount?: number | any | null;
    place?: string | null;
  }): Promise<void> {
    try {
      const {
        millId,
        frameNo,
        mcModel,
        mfgDate,
        installationDate,
        invoiceNo,
        invoiceDate,
        warrantyYears,
        warrantyMonths,
        warrantyStartDate,
        warrantyClosingDate,
        amcStartingDate,
        amcClosingDate,
        amcPeriod,
        amcParticular,
        amcAmount,
        place,
      } = params;

      const mill = await this.prisma.mill.findUnique({
        where: { id: millId },
        include: { customer: true },
      });

      if (!mill) return;

      // Find an existing master-mill record matching by frame_no, invoice_no, or mill_id
      let existing: any = null;
      if (frameNo && frameNo.trim()) {
        existing = await this.prisma.masterMill.findFirst({
          where: {
            deleted_at: null,
            frame_no: frameNo.trim(),
          },
        });
      }
      if (!existing && invoiceNo && invoiceNo.trim()) {
        existing = await this.prisma.masterMill.findFirst({
          where: {
            deleted_at: null,
            invoice_no: invoiceNo.trim(),
          },
        });
      }
      if (!existing) {
        existing = await this.prisma.masterMill.findFirst({
          where: {
            deleted_at: null,
            mill_id: millId,
          },
        });
      }

      // Compute warranty closing date if not provided
      let finalWarrantyClosingDate = warrantyClosingDate;
      const baseDate = warrantyStartDate || installationDate;
      if (!finalWarrantyClosingDate && baseDate) {
        const totalMonths = (warrantyMonths ?? 0) + (warrantyYears ?? 0) * 12;
        if (totalMonths > 0) {
          const calcDate = new Date(baseDate);
          calcDate.setMonth(calcDate.getMonth() + totalMonths);
          calcDate.setDate(calcDate.getDate() - 1);
          finalWarrantyClosingDate = calcDate;
        }
      }

      // Compute AMC starting and closing dates if not provided
      let finalAmcStartingDate = amcStartingDate;
      const wEndForAmc =
        finalWarrantyClosingDate ||
        (existing?.warranty_closing_date
          ? new Date(existing.warranty_closing_date)
          : null);
      if (!finalAmcStartingDate && amcPeriod && amcPeriod > 0 && wEndForAmc) {
        const autoStart = new Date(wEndForAmc);
        autoStart.setDate(autoStart.getDate() + 1);
        finalAmcStartingDate = autoStart;
      }

      let finalAmcClosingDate = amcClosingDate;
      if (
        !finalAmcClosingDate &&
        finalAmcStartingDate &&
        amcPeriod &&
        amcPeriod > 0
      ) {
        const calcDate = new Date(finalAmcStartingDate);
        calcDate.setMonth(calcDate.getMonth() + amcPeriod);
        calcDate.setDate(calcDate.getDate() - 1);
        finalAmcClosingDate = calcDate;
      }

      // Determine warranty status dynamically
      let allWarranty = 'Non Warranty';
      const now = new Date();
      const wClose = finalWarrantyClosingDate || (existing?.warranty_closing_date ? new Date(existing.warranty_closing_date) : null);
      const aClose = finalAmcClosingDate || (existing?.amc_closing_date ? new Date(existing.amc_closing_date) : null);
      if (wClose && wClose > now) {
        allWarranty = 'Under Warranty';
      } else if (aClose && aClose > now) {
        allWarranty = 'Under AMC';
      } else if (wClose || aClose) {
        allWarranty = 'Expired';
      }

      if (existing) {
        const updates: Record<string, any> = { all_warranty: allWarranty };
        if (frameNo && frameNo.trim() && existing.frame_no !== frameNo.trim())
          updates.frame_no = frameNo.trim();
        if (mcModel && mcModel.trim() && existing.mc_model !== mcModel.trim())
          updates.mc_model = mcModel.trim();
        if (mfgDate) updates.mfg_date = mfgDate;
        if (installationDate) updates.installation_date = installationDate;
        if (invoiceNo && invoiceNo.trim() && existing.invoice_no !== invoiceNo.trim())
          updates.invoice_no = invoiceNo.trim();
        if (invoiceDate) updates.invoice_date = invoiceDate;
        if (warrantyYears !== undefined && warrantyYears !== null)
          updates.warranty_years = warrantyYears;
        if (warrantyMonths !== undefined && warrantyMonths !== null)
          updates.warranty_months = warrantyMonths;
        if (warrantyStartDate) updates.warranty_start_date = warrantyStartDate;
        if (finalWarrantyClosingDate)
          updates.warranty_closing_date = finalWarrantyClosingDate;
        if (finalAmcStartingDate) updates.amc_starting_date = finalAmcStartingDate;
        if (finalAmcClosingDate) updates.amc_closing_date = finalAmcClosingDate;
        if (amcPeriod !== undefined && amcPeriod !== null)
          updates.amc_period = amcPeriod;
        if (amcParticular && amcParticular.trim())
          updates.amc_particular = amcParticular.trim();
        if (amcAmount !== undefined && amcAmount !== null)
          updates.amc_amount = amcAmount;
        if (place && place.trim()) updates.place = place.trim();
        if (existing.mill_id !== millId) updates.mill_id = millId;

        await this.prisma.masterMill.update({
          where: { id: existing.id },
          data: updates,
        });
      } else {
        const fallbackInvoiceNo =
          invoiceNo?.trim() ||
          `INV-IR-${mill.ref_no || millId.slice(0, 8)}-${Date.now()}`;
        await this.prisma.masterMill.create({
          data: {
            invoice_no: fallbackInvoiceNo,
            invoice_date: invoiceDate || undefined,
            ref_no: mill.ref_no || undefined,
            frame_no: frameNo?.trim() || undefined,
            mc_model: mcModel?.trim() || undefined,
            mfg_date: mfgDate || undefined,
            installation_date: installationDate || undefined,
            warranty_years: warrantyYears ?? 0,
            warranty_months: warrantyMonths ?? 0,
            warranty_start_date: warrantyStartDate || undefined,
            warranty_closing_date: finalWarrantyClosingDate || undefined,
            all_warranty: allWarranty,
            amc_starting_date: finalAmcStartingDate || undefined,
            amc_period: amcPeriod ?? undefined,
            amc_particular: amcParticular?.trim() || undefined,
            amc_closing_date: finalAmcClosingDate || undefined,
            amc_amount: amcAmount ?? 0,
            address: mill.address || undefined,
            place: place?.trim() || mill.place || undefined,
            phone_no: mill.phone || undefined,
            mill_id: millId,
            status: 'ACTIVE',
          },
        });
      }

      // Invalidate master-mills list cache
      await this.redis.delByPrefix(this.LIST_CACHE_KEY);
    } catch (error) {
      console.error('Error in syncFromInstallationReport:', error);
    }
  }

  private async invalidateCache(id?: string) {
    const promises: Promise<any>[] = [
      this.redis.delByPrefix(this.LIST_CACHE_KEY),
      this.redis.delByPrefix('master_mills:'),
      this.redis.delByPrefix('reports:master-mills'),
    ];
    if (id) {
      promises.push(this.redis.del(`${this.CACHE_PREFIX}id:${id}`));
    }
    await Promise.all(promises);
  }

  private formatPhoneNumber(phone: string | undefined): string | undefined {
    if (!phone) return undefined;
    let cleaned = phone.trim().replace(/[-\s()]/g, '');
    if (cleaned === '') return undefined;

    if (cleaned.startsWith('+')) {
      return cleaned;
    }

    if (cleaned.startsWith('0') && cleaned.length === 11) {
      cleaned = cleaned.substring(1);
    }

    if (cleaned.length === 10 && /^\d+$/.test(cleaned)) {
      return `+91${cleaned}`;
    }

    if (cleaned.length === 12 && cleaned.startsWith('91') && /^\d+$/.test(cleaned)) {
      return `+${cleaned}`;
    }

    if (/^\d+$/.test(cleaned)) {
      return `+91${cleaned}`;
    }

    return cleaned;
  }
}
