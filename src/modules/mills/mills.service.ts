import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { Prisma } from '@prisma/client';
import { CreateMillDto } from './dto/create-mill.dto';
import { UpdateMillDto } from './dto/update-mill.dto';

@Injectable()
export class MillsService {
  private readonly CACHE_PREFIX = 'mill:';
  private readonly LIST_CACHE_KEY = 'mills:list:';

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async checkRefNoAvailability(
    refNo: string,
    excludeMillId?: string,
  ): Promise<{ available: boolean; existingMillName?: string }> {
    const cleanRef = refNo?.trim();
    if (!cleanRef) {
      return { available: true };
    }

    // Check in mills table
    const existingMill = await this.prisma.mill.findFirst({
      where: {
        ref_no: { equals: cleanRef, mode: 'insensitive' },
        deleted_at: null,
        ...(excludeMillId ? { id: { not: excludeMillId } } : {}),
      },
      select: { id: true, name: true },
    });

    if (existingMill) {
      return {
        available: false,
        existingMillName: existingMill.name,
      };
    }

    // Also check master mills if linked to a different mill
    const existingMasterMill = await this.prisma.masterMill.findFirst({
      where: {
        ref_no: { equals: cleanRef, mode: 'insensitive' },
        deleted_at: null,
        ...(excludeMillId ? { mill_id: { not: excludeMillId } } : {}),
      },
      select: {
        id: true,
        mill: { select: { name: true } },
      },
    });

    if (existingMasterMill) {
      return {
        available: false,
        existingMillName: existingMasterMill.mill?.name || 'Master Mill Record',
      };
    }

    return { available: true };
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.MillWhereInput;
    orderBy?: Prisma.MillOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params;

    // Generate a unique cache key based on params
    const cacheKey = `${this.LIST_CACHE_KEY}${JSON.stringify(params)}`;
    const cachedData = await this.redis.getJson<any>(cacheKey);

    if (cachedData) return cachedData;

    const [mills, total] = await Promise.all([
      this.prisma.mill.findMany({
        skip,
        take,
        where: { ...where, deleted_at: null },
        include: {
          customer: { select: { id: true, name: true } },
          masterMills: {
            where: { deleted_at: null },
            select: { invoice_date: true },
            orderBy: { created_at: 'desc' },
            take: 1,
          },
        },
        orderBy,
      }),
      this.prisma.mill.count({ where: { ...where, deleted_at: null } }),
    ]);

    const mappedMills = mills.map((mill) => {
      const firstMasterMill = mill.masterMills?.[0];
      const invoiceDate = firstMasterMill?.invoice_date || null;
      return {
        ...mill,
        invoice_date: invoiceDate,
        invoicedate: invoiceDate,
      };
    });

    const result = { mills: mappedMills, total };
    await this.redis.setJson(cacheKey, result, 300); // Cache for 5 mins
    return result;
  }

  async findById(id: string) {
    const cacheKey = `${this.CACHE_PREFIX}id:${id}`;
    const cached = await this.redis.getJson<any>(cacheKey);
    if (cached) return cached;

    const mill = await this.prisma.mill.findFirst({
      where: { id, deleted_at: null },
      include: {
        customer: { select: { id: true, name: true } },
        masterMills: {
          where: { deleted_at: null },
          select: { invoice_date: true },
          orderBy: { created_at: 'desc' },
          take: 1,
        },
      },
    });

    if (mill) {
      const firstMasterMill = mill.masterMills?.[0];
      const invoiceDate = firstMasterMill?.invoice_date || null;
      const mapped = {
        ...mill,
        invoice_date: invoiceDate,
        invoicedate: invoiceDate,
      };
      await this.redis.setJson(cacheKey, mapped, 3600);
      return mapped;
    }
    return null;
  }

  async create(dto: CreateMillDto) {
    const cleanRef = dto.ref_no?.trim();
    if (cleanRef) {
      const check = await this.checkRefNoAvailability(cleanRef);
      if (!check.available) {
        throw new BadRequestException(
          `Reference Number "${cleanRef}" is already assigned to mill "${check.existingMillName}".`,
        );
      }
    }

    const mill = await this.prisma.mill.create({
      data: {
        ...dto,
        ref_no: cleanRef || null,
      },
    });

    await this.invalidateCache();
    return mill;
  }

  async update(id: string, dto: UpdateMillDto) {
    const existing = await this.prisma.mill.findFirst({
      where: { id, deleted_at: null },
    });
    if (!existing) {
      throw new NotFoundException('Mill not found');
    }

    const cleanRef =
      dto.ref_no !== undefined ? dto.ref_no?.trim() || null : undefined;

    // Validate if ref_no is being changed to a non-empty string that differs from current
    if (
      cleanRef &&
      (!existing.ref_no ||
        existing.ref_no.trim().toLowerCase() !== cleanRef.toLowerCase())
    ) {
      const check = await this.checkRefNoAvailability(cleanRef, id);
      if (!check.available) {
        throw new BadRequestException(
          `Reference Number "${cleanRef}" is already assigned to mill "${check.existingMillName}".`,
        );
      }
    }

    const mill = await this.prisma.mill.update({
      where: { id },
      data: {
        ...dto,
        ...(cleanRef !== undefined ? { ref_no: cleanRef } : {}),
      },
    });

    await this.invalidateCache(id);
    return { before: existing, after: mill };
  }

  async remove(id: string) {
    const existing = await this.prisma.mill.findFirst({
      where: { id, deleted_at: null },
    });
    if (!existing) {
      throw new NotFoundException('Mill not found');
    }

    const mill = await this.prisma.mill.update({
      where: { id },
      data: { deleted_at: new Date(), status: 'DELETED' },
    });

    await this.invalidateCache(id);
    return mill;
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
