import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { CreateMobileExpenseDto } from './dto/create-mobile-expense.dto';
import { UpdateMobileExpenseDto } from './dto/update-mobile-expense.dto';


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

  async findAll(
    params: {
      skip?: number;
      take?: number;
      search?: string;
      status?: string;
      dateFrom?: string;
      dateTo?: string;
    },
    user?: { userId: string; role: string },
  ) {
    const cacheKey = `${this.LIST_CACHE_KEY}${JSON.stringify({ params, user })}`;
    const cachedData = await this.redis.getJson<any>(cacheKey);
    if (cachedData) return cachedData;

    const { skip, take, search, status, dateFrom, dateTo } = params;

    const where: any = { deleted_at: null };

    if (user && user.role === 'Service Engineer') {
      where.technicians = {
        some: {
          technician_id: user.userId,
        },
      };
    }

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

  async findById(id: string, user?: { userId: string; role: string }) {
    const cacheKey = `${this.CACHE_PREFIX}id:${id}:${user?.userId || 'all'}`;
    const cached = await this.redis.getJson<any>(cacheKey);
    if (cached) return cached;

    const expense = await this.prisma.expense.findFirst({
      where: { id, deleted_at: null },
      include: INCLUDE_SHAPE,
    });

    if (!expense) {
      throw new NotFoundException(`Expense with ID "${id}" not found`);
    }

    if (user && user.role === 'Service Engineer') {
      const isAssigned = expense.technicians.some(
        (t) => t.technician_id === user.userId,
      );
      if (!isAssigned) {
        throw new ForbiddenException(
          'You do not have permission to access this expense',
        );
      }
    }

    await this.redis.setJson(cacheKey, expense, 3600); // Cache for 1 hour
    return expense;
  }

  async create(dto: CreateExpenseDto | CreateMobileExpenseDto, user?: { userId: string; role: string }) {
    const rawDto = dto as any;
    const { technician_ids, ...expenseData } = rawDto;
    delete expenseData.customer_id;
    delete expenseData.technician_id;

    const finalTechnicianIds = [...(technician_ids || [])];
    if (rawDto.technician_id && !finalTechnicianIds.includes(rawDto.technician_id)) {
      finalTechnicianIds.push(rawDto.technician_id);
    }

    if (
      user &&
      user.role === 'Service Engineer' &&
      !finalTechnicianIds.includes(user.userId)
    ) {
      finalTechnicianIds.push(user.userId);
    }

    // Validate expense category exists
    const categoryExists = await this.prisma.expenseCategory.findFirst({
      where: { id: expenseData.expense_category_id, deleted_at: null },
    });
    if (!categoryExists) {
      throw new BadRequestException(
        `Expense category with ID "${expenseData.expense_category_id}" not found`,
      );
    }

    // Validate mill exists if mill_id is provided
    if (expenseData.mill_id) {
      const millExists = await this.prisma.mill.findFirst({
        where: { id: expenseData.mill_id, deleted_at: null },
      });
      if (!millExists) {
        throw new BadRequestException(
          `Mill with ID "${expenseData.mill_id}" not found`,
        );
      }
    }

    // Validate all technician_ids exist
    if (finalTechnicianIds.length > 0) {
      const techniciansCount = await this.prisma.technician.count({
        where: { id: { in: finalTechnicianIds }, deleted_at: null },
      });
      if (techniciansCount !== finalTechnicianIds.length) {
        throw new BadRequestException('One or more technician IDs are invalid');
      }
    } else {
      throw new BadRequestException('At least one technician ID is required');
    }

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
        data: finalTechnicianIds.map((tid) => ({
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

  async update(
    id: string,
    dto: UpdateExpenseDto | UpdateMobileExpenseDto,
    user?: { userId: string; role: string },
  ) {
    await this.findById(id, user);

    const rawDto = dto as any;
    const { technician_ids, ...expenseData } = rawDto;
    delete expenseData.customer_id;
    delete expenseData.technician_id;

    let finalTechnicianIds = technician_ids !== undefined ? [...technician_ids] : undefined;
    if (rawDto.technician_id !== undefined) {
      if (finalTechnicianIds !== undefined) {
        if (rawDto.technician_id && !finalTechnicianIds.includes(rawDto.technician_id)) {
          finalTechnicianIds.push(rawDto.technician_id);
        }
      } else {
        finalTechnicianIds = rawDto.technician_id ? [rawDto.technician_id] : [];
      }
    }

    // Validate expense category if provided
    if (expenseData.expense_category_id !== undefined) {
      const categoryExists = await this.prisma.expenseCategory.findFirst({
        where: { id: expenseData.expense_category_id, deleted_at: null },
      });
      if (!categoryExists) {
        throw new BadRequestException(
          `Expense category with ID "${expenseData.expense_category_id}" not found`,
        );
      }
    }

    // Validate mill if provided
    if (expenseData.mill_id !== undefined && expenseData.mill_id !== null) {
      const millExists = await this.prisma.mill.findFirst({
        where: { id: expenseData.mill_id, deleted_at: null },
      });
      if (!millExists) {
        throw new BadRequestException(
          `Mill with ID "${expenseData.mill_id}" not found`,
        );
      }
    }

    // Validate technician_ids if provided
    if (finalTechnicianIds !== undefined && finalTechnicianIds.length > 0) {
      const techniciansCount = await this.prisma.technician.count({
        where: { id: { in: finalTechnicianIds }, deleted_at: null },
      });
      if (techniciansCount !== finalTechnicianIds.length) {
        throw new BadRequestException('One or more technician IDs are invalid');
      }
    }

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
    if (finalTechnicianIds !== undefined) {
      await this.prisma.expenseTechnician.deleteMany({
        where: { expense_id: id },
      });
      await this.prisma.expenseTechnician.createMany({
        data: finalTechnicianIds.map((tid) => ({
          expense_id: id,
          technician_id: tid,
        })),
      });
    }

    await this.invalidateCache(id);
    return expense;
  }

  async remove(id: string, user?: { userId: string; role: string }) {
    await this.findById(id, user);

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
