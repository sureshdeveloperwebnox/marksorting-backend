import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

const INCLUDE_SHAPE = {
  mill: { select: { id: true, name: true } },
  expenseCategory: { select: { id: true, name: true } },
  technicians: {
    include: { technician: { select: { id: true, full_name: true } } },
  },
} as const;

@Injectable()
export class ExpensesService {
  private readonly CACHE_PREFIX = 'expense:';
  private readonly LIST_CACHE_KEY = 'expenses:list:';

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    search?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const cacheKey = `${this.LIST_CACHE_KEY}${JSON.stringify(params)}`;
    const cachedData = await this.redis.getJson<any>(cacheKey);
    if (cachedData) return cachedData;

    const { skip, take, search, status, dateFrom, dateTo } = params;

    const where: any = { deleted_at: null };

    if (search) {
      where.OR = [
        { expense_number: { contains: search, mode: 'insensitive' } },
        { place: { contains: search, mode: 'insensitive' } },
        { others: { contains: search, mode: 'insensitive' } },
        { mill: { name: { contains: search, mode: 'insensitive' } } },
        {
          expenseCategory: { name: { contains: search, mode: 'insensitive' } },
        },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (dateFrom || dateTo) {
      where.visit_date = {};
      if (dateFrom) {
        where.visit_date.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.visit_date.lte = new Date(dateTo);
      }
    }

    const [expenses, total] = await Promise.all([
      this.prisma.expense.findMany({
        skip,
        take,
        where,
        include: INCLUDE_SHAPE,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.expense.count({ where }),
    ]);

    const result = { expenses, total };
    await this.redis.setJson(cacheKey, result, 300); // Cache for 5 mins
    return result;
  }

  async findById(id: string) {
    const cacheKey = `${this.CACHE_PREFIX}id:${id}`;
    const cached = await this.redis.getJson<any>(cacheKey);
    if (cached) return cached;

    const expense = await this.prisma.expense.findFirst({
      where: { id, deleted_at: null },
      include: INCLUDE_SHAPE,
    });

    if (!expense) {
      throw new NotFoundException(`Expense with ID "${id}" not found`);
    }

    await this.redis.setJson(cacheKey, expense, 3600); // Cache for 1 hour
    return expense;
  }

  async create(dto: CreateExpenseDto) {
    const { technician_ids, ...expenseData } = dto;

    const expense = await this.prisma.$transaction(async (tx) => {
      // Compute today's UTC date boundaries
      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setUTCHours(23, 59, 59, 999);

      // Count expenses created today
      const count = await tx.expense.count({
        where: { created_at: { gte: todayStart, lte: todayEnd } },
      });

      // Format: EXP-YYYYMMDD-X (unpadded sequence, starting at 1)
      const dateStr = todayStart.toISOString().slice(0, 10).replace(/-/g, '');
      const seq = String(count + 1);
      const expense_number = `EXP-${dateStr}-${seq}`;

      // Insert the expense record
      const created = await tx.expense.create({
        data: {
          expense_number,
          visit_date: new Date(expenseData.visit_date),
          visit_time: expenseData.visit_time,
          expense_category_id: expenseData.expense_category_id,
          place: expenseData.place || null,
          others: expenseData.others || null,
          amount: expenseData.amount ? String(expenseData.amount) : '0',
          status: expenseData.status || 'PENDING',
          expense_images: expenseData.expense_images || [],
          mill_id: expenseData.mill_id || null,
        },
        include: INCLUDE_SHAPE,
      });

      // Create ExpenseTechnician join rows
      await tx.expenseTechnician.createMany({
        data: technician_ids.map((tid) => ({
          expense_id: created.id,
          technician_id: tid,
        })),
      });

      // Re-fetch with technicians included
      return tx.expense.findFirst({
        where: { id: created.id },
        include: INCLUDE_SHAPE,
      });
    });

    await this.invalidateCache();
    return expense;
  }

  async update(id: string, dto: UpdateExpenseDto) {
    await this.findById(id);

    const { technician_ids, ...expenseData } = dto;

    const updateData: any = {};

    if (expenseData.visit_date !== undefined) {
      updateData.visit_date = new Date(expenseData.visit_date);
    }
    if (expenseData.visit_time !== undefined) {
      updateData.visit_time = expenseData.visit_time;
    }
    if (expenseData.expense_category_id !== undefined) {
      updateData.expense_category_id = expenseData.expense_category_id;
    }
    if (expenseData.place !== undefined) {
      updateData.place = expenseData.place || null;
    }
    if (expenseData.others !== undefined) {
      updateData.others = expenseData.others || null;
    }
    if (expenseData.amount !== undefined) {
      updateData.amount = expenseData.amount ? String(expenseData.amount) : '0';
    }
    if (expenseData.status !== undefined) {
      updateData.status = expenseData.status;
    }
    if (expenseData.expense_images !== undefined) {
      updateData.expense_images = expenseData.expense_images;
    }
    if (expenseData.mill_id !== undefined) {
      updateData.mill_id = expenseData.mill_id || null;
    }

    const expense = await this.prisma.expense.update({
      where: { id },
      data: updateData,
      include: INCLUDE_SHAPE,
    });

    // Sync technician join table
    if (technician_ids !== undefined) {
      await this.prisma.expenseTechnician.deleteMany({
        where: { expense_id: id },
      });
      await this.prisma.expenseTechnician.createMany({
        data: technician_ids.map((tid) => ({
          expense_id: id,
          technician_id: tid,
        })),
      });
    }

    await this.invalidateCache(id);
    return expense;
  }

  async remove(id: string) {
    await this.findById(id);

    const expense = await this.prisma.expense.update({
      where: { id },
      data: { deleted_at: new Date() },
      include: INCLUDE_SHAPE,
    });

    await this.invalidateCache(id);
    return expense;
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
