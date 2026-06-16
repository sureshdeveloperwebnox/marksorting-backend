import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { S3Service } from '../../shared/services/s3.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { CreateMobileExpenseDto } from './dto/create-mobile-expense.dto';
import { UpdateMobileExpenseDto } from './dto/update-mobile-expense.dto';
import { getAutoVisitTime } from '../../common/utils/date-time';

const INCLUDE_SHAPE = {
  mill: {
    select: {
      id: true,
      name: true,
      customer: { select: { id: true, name: true } },
    },
  },
  expenseCategory: { select: { id: true, name: true } },
  expense_items: {
    include: {
      expenseCategory: { select: { id: true, name: true } },
    },
  },
  technicians: {
    include: { technician: { select: { id: true, full_name: true } } },
  },
} as const;

@Injectable()
export class ExpensesService {
  private readonly CACHE_PREFIX = 'expense:';
  private readonly LIST_CACHE_KEY = 'expenses:list:';
  private readonly logger = new Logger(ExpensesService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private eventEmitter: EventEmitter2,
    private s3Service: S3Service,
  ) {}

  /**
   * Transform expense image keys to full S3 URLs
   * @param expense The expense object with expense_images array
   * @returns Expense with image URLs transformed
   */
  private mapExpenseImageUrls(expense: any): any {
    if (!expense) return expense;

    const mappedExpense = {
      ...expense,
      expense_images: (expense.expense_images || []).map((key: string) => {
        // If it's already a full URL, return as-is
        if (key.startsWith('http')) return key;
        // Otherwise, convert S3 key to full URL
        return this.s3Service.getFileUrl(key);
      }),
    };

    if (mappedExpense.expense_items) {
      mappedExpense.expense_items = mappedExpense.expense_items.map((item: any) => ({
        ...item,
        expense_images: (item.expense_images || []).map((key: string) => {
          if (key.startsWith('http')) return key;
          return this.s3Service.getFileUrl(key);
        }),
      }));
    }

    return mappedExpense;
  }

  /**
   * Transform array of expenses with image URLs
   */
  private mapExpensesImageUrls(expenses: any[]): any[] {
    return expenses.map((expense) => this.mapExpenseImageUrls(expense));
  }

  async findAll(
    params: {
      skip?: number;
      take?: number;
      search?: string;
      status?: string;
      technicianId?: string;
      dateFrom?: string;
      dateTo?: string;
    },
    user?: { userId: string; role: string },
  ) {
    const cacheKey = `${this.LIST_CACHE_KEY}${JSON.stringify({ params, user })}`;
    const cachedData = await this.redis.getJson<any>(cacheKey);
    if (cachedData) return cachedData;

    const { skip, take, search, status, technicianId, dateFrom, dateTo } =
      params;

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
        { remarks: { contains: search, mode: 'insensitive' } },
        { mill: { name: { contains: search, mode: 'insensitive' } } },
        {
          expenseCategory: { name: { contains: search, mode: 'insensitive' } },
        },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (technicianId) {
      if (user && user.role === 'Service Engineer') {
        where.technicians = {
          some: {
            technician_id: user.userId,
          },
        };
      } else {
        where.technicians = {
          some: {
            technician_id: technicianId,
          },
        };
      }
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

    // Map image keys to full URLs
    const expensesWithUrls = this.mapExpensesImageUrls(expenses);
    const result = { expenses: expensesWithUrls, total };
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

    // Map image keys to full URLs
    const expenseWithUrls = this.mapExpenseImageUrls(expense);
    await this.redis.setJson(cacheKey, expenseWithUrls, 3600); // Cache for 1 hour
    return expenseWithUrls;
  }

  async create(
    dto: CreateExpenseDto | CreateMobileExpenseDto,
    user?: { userId: string; role: string },
  ) {
    const rawDto = dto as any;
    const { technician_ids, ...expenseData } = rawDto;
    delete expenseData.customer_id;
    delete expenseData.technician_id;

    const finalTechnicianIds = [...(technician_ids || [])];
    if (
      rawDto.technician_id &&
      !finalTechnicianIds.includes(rawDto.technician_id)
    ) {
      finalTechnicianIds.push(rawDto.technician_id);
    }

    if (
      user &&
      user.role === 'Service Engineer' &&
      !finalTechnicianIds.includes(user.userId)
    ) {
      finalTechnicianIds.push(user.userId);
    }

    // Validate expense category / items exist
    if (expenseData.expense_items && expenseData.expense_items.length > 0) {
      const categoryIds = expenseData.expense_items.map((it: any) => it.expense_category_id);
      const categoriesCount = await this.prisma.expenseCategory.count({
        where: { id: { in: categoryIds }, deleted_at: null },
      });
      if (categoriesCount !== new Set(categoryIds).size) {
        throw new BadRequestException('One or more expense category IDs are invalid');
      }
    } else if (expenseData.expense_category_id) {
      const categoryExists = await this.prisma.expenseCategory.findFirst({
        where: { id: expenseData.expense_category_id, deleted_at: null },
      });
      if (!categoryExists) {
        throw new BadRequestException(
          `Expense category with ID "${expenseData.expense_category_id}" not found`,
        );
      }
    } else {
      throw new BadRequestException('Expense category or items are required');
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

      // Calculate aggregated fields for root-level backward compatibility
      const items = expenseData.expense_items || [];
      const firstItem = items[0];
      const rootCategoryId = firstItem ? firstItem.expense_category_id : (expenseData.expense_category_id || null);
      const totalAmount = items.length
        ? items.reduce((sum: number, it: any) => sum + (it.amount || 0), 0)
        : (expenseData.amount || 0);
      const totalAdminAmount = items.length
        ? items.reduce((sum: number, it: any) => sum + (it.admin_amount || 0), 0)
        : (expenseData.admin_amount || 0);
      const rootRemarks = firstItem ? (firstItem.remarks || expenseData.remarks || null) : (expenseData.remarks || null);
      const rootImages = items.length
        ? Array.from(new Set(items.flatMap((it: any) => it.expense_images || [])))
        : (expenseData.expense_images || []);

      // Insert the expense record
      const created = await tx.expense.create({
        data: {
          expense_number,
          visit_date: new Date(expenseData.visit_date),
          visit_time: (expenseData.visit_time && expenseData.visit_time.trim()) ? expenseData.visit_time : getAutoVisitTime(),
          expense_category_id: rootCategoryId,
          place: expenseData.place || null,
          others: expenseData.others || null,
          remarks: rootRemarks,
          amount: String(totalAmount),
          admin_amount: String(totalAdminAmount),
          status: expenseData.status || 'PENDING',
          expense_images: rootImages,
          mill_id: expenseData.mill_id || null,
        },
      });

      // Create ExpenseItems if provided
      if (items.length > 0) {
        await tx.expenseItem.createMany({
          data: items.map((it: any) => ({
            expense_id: created.id,
            expense_category_id: it.expense_category_id,
            amount: String(it.amount || 0),
            admin_amount: String(it.admin_amount || 0),
            remarks: it.remarks || null,
            expense_images: it.expense_images || [],
          })),
        });
      } else if (rootCategoryId) {
        // Fallback for single/legacy category submissions
        await tx.expenseItem.create({
          data: {
            expense_id: created.id,
            expense_category_id: rootCategoryId,
            amount: String(expenseData.amount || 0),
            admin_amount: String(expenseData.admin_amount || 0),
            remarks: rootRemarks,
            expense_images: rootImages,
          },
        });
      }

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

    if (expense?.expense_images && expense.expense_images.length > 0) {
      const imageAclPromises = expense.expense_images.map((img: string) =>
        this.s3Service.makeObjectPublic(img),
      );
      await Promise.all(imageAclPromises).catch((err) => {
        this.logger.error(`Error making expense images public: ${err.message}`);
      });
    }

    if (expense) {
      this.eventEmitter.emit('expense.created', {
        expenseNumber: expense.expense_number,
        amount: expense.amount?.toString() || '0',
        creatorUserId: user?.userId,
        technicianUserIds: finalTechnicianIds,
      });
    }

    return expense;
  }

  async update(
    id: string,
    dto: UpdateExpenseDto | UpdateMobileExpenseDto,
    user?: { userId: string; role: string },
  ) {
    const existingExpense = await this.findById(id, user);

    const rawDto = dto as any;
    const { technician_ids, ...expenseData } = rawDto;
    delete expenseData.customer_id;
    if (technician_ids === undefined) {
      delete rawDto.technician_id;
    }

    let finalTechnicianIds =
      technician_ids !== undefined ? [...technician_ids] : undefined;
    if (rawDto.technician_id !== undefined) {
      if (finalTechnicianIds !== undefined) {
        if (
          rawDto.technician_id &&
          !finalTechnicianIds.includes(rawDto.technician_id)
        ) {
          finalTechnicianIds.push(rawDto.technician_id);
        }
      } else {
        finalTechnicianIds = rawDto.technician_id ? [rawDto.technician_id] : [];
      }
    }

    // Validate expense category if provided
    if (expenseData.expense_items && expenseData.expense_items.length > 0) {
      const categoryIds = expenseData.expense_items.map((it: any) => it.expense_category_id);
      const categoriesCount = await this.prisma.expenseCategory.count({
        where: { id: { in: categoryIds }, deleted_at: null },
      });
      if (categoriesCount !== new Set(categoryIds).size) {
        throw new BadRequestException('One or more expense category IDs are invalid');
      }
    } else if (expenseData.expense_category_id !== undefined) {
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
      updateData.visit_time = (expenseData.visit_time && expenseData.visit_time.trim())
        ? expenseData.visit_time
        : getAutoVisitTime();
    }
    if (expenseData.place !== undefined) {
      updateData.place = expenseData.place || null;
    }
    if (expenseData.others !== undefined) {
      updateData.others = expenseData.others || null;
    }
    if (expenseData.status !== undefined) {
      updateData.status = expenseData.status;
    }
    if (expenseData.mill_id !== undefined) {
      updateData.mill_id = expenseData.mill_id || null;
    }

    // Calculate aggregated items fields
    const hasItems = expenseData.expense_items !== undefined;
    if (hasItems) {
      const items = expenseData.expense_items || [];
      const firstItem = items[0];
      updateData.expense_category_id = firstItem ? firstItem.expense_category_id : null;
      const totalAmount = items.reduce((sum: number, it: any) => sum + (it.amount || 0), 0);
      updateData.amount = String(totalAmount);
      const totalAdminAmount = items.reduce((sum: number, it: any) => sum + (it.admin_amount || 0), 0);
      updateData.admin_amount = String(totalAdminAmount);
      updateData.remarks = firstItem ? (firstItem.remarks || null) : null;
      updateData.expense_images = Array.from(new Set(items.flatMap((it: any) => it.expense_images || [])));
    } else {
      // Legacy updates
      if (expenseData.expense_category_id !== undefined) {
        updateData.expense_category_id = expenseData.expense_category_id;
      }
      if (expenseData.amount !== undefined) {
        updateData.amount = expenseData.amount ? String(expenseData.amount) : '0';
      }
      if (expenseData.admin_amount !== undefined) {
        updateData.admin_amount = expenseData.admin_amount ? String(expenseData.admin_amount) : '0';
      }
      if (expenseData.remarks !== undefined) {
        updateData.remarks = expenseData.remarks || null;
      }
      if (expenseData.expense_images !== undefined) {
        updateData.expense_images = expenseData.expense_images;
      }
    }

    const expense = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.expense.update({
        where: { id },
        data: updateData,
        include: INCLUDE_SHAPE,
      });

      if (hasItems) {
        // Delete all old items and create new ones
        await tx.expenseItem.deleteMany({
          where: { expense_id: id },
        });

        if (expenseData.expense_items.length > 0) {
          await tx.expenseItem.createMany({
            data: expenseData.expense_items.map((it: any) => ({
              expense_id: id,
              expense_category_id: it.expense_category_id,
              amount: String(it.amount || 0),
              admin_amount: String(it.admin_amount || 0),
              remarks: it.remarks || null,
              expense_images: it.expense_images || [],
            })),
          });
        }
      } else {
        // Sync legacy updates directly to the first/matching ExpenseItem
        const firstItem = await tx.expenseItem.findFirst({
          where: { expense_id: id },
        });
        if (firstItem) {
          await tx.expenseItem.update({
            where: { id: firstItem.id },
            data: {
              expense_category_id: updateData.expense_category_id !== undefined ? updateData.expense_category_id : undefined,
              amount: updateData.amount !== undefined ? updateData.amount : undefined,
              admin_amount: updateData.admin_amount !== undefined ? updateData.admin_amount : undefined,
              remarks: updateData.remarks !== undefined ? updateData.remarks : undefined,
              expense_images: updateData.expense_images !== undefined ? updateData.expense_images : undefined,
            },
          });
        } else if (updateData.expense_category_id) {
          await tx.expenseItem.create({
            data: {
              expense_id: id,
              expense_category_id: updateData.expense_category_id,
              amount: updateData.amount || '0',
              admin_amount: updateData.admin_amount || '0',
              remarks: updateData.remarks || null,
              expense_images: updateData.expense_images || [],
            },
          });
        }
      }

      // Sync technician join table
      if (finalTechnicianIds !== undefined) {
        await tx.expenseTechnician.deleteMany({
          where: { expense_id: id },
        });
        await tx.expenseTechnician.createMany({
          data: finalTechnicianIds.map((tid) => ({
            expense_id: id,
            technician_id: tid,
          })),
        });
      }

      return tx.expense.findFirst({
        where: { id },
        include: INCLUDE_SHAPE,
      });
    });

    await this.invalidateCache(id);

    if (expense?.expense_images && expense.expense_images.length > 0) {
      const imageAclPromises = expense.expense_images.map((img: string) =>
        this.s3Service.makeObjectPublic(img),
      );
      await Promise.all(imageAclPromises).catch((err) => {
        this.logger.error(`Error making expense images public: ${err.message}`);
      });
    }

    if ((dto as any).status && expense) {
      const technicianUserIds: string[] =
        (expense as any).technicians?.map((t: any) => t.technician_id) ?? [];
      this.eventEmitter.emit('expense.status_updated', {
        expenseNumber: expense.expense_number,
        status: expense.status,
        technicianUserIds,
      });
    }

    return { before: existingExpense, after: expense };
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
      this.redis.delByPrefix('reports:'),
    ];
    if (id) {
      promises.push(this.redis.delByPrefix(`${this.CACHE_PREFIX}id:${id}`));
    }
    await Promise.all(promises);
  }
}
