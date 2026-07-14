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
    orderBy: { created_at: 'asc' },
  },
  technicians: {
    include: { technician: { select: { id: true, full_name: true } } },
  },
  serviceReport: {
    select: {
      id: true,
      report_number: true,
    },
  },
  installationReport: {
    select: {
      id: true,
      report_number: true,
    },
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
      mappedExpense.expense_items = mappedExpense.expense_items.map(
        (item: any) => ({
          ...item,
          expense_images: (item.expense_images || []).map((key: string) => {
            if (key.startsWith('http')) return key;
            return this.s3Service.getFileUrl(key);
          }),
        }),
      );
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
        const [fy, fm, fd] = dateFrom.split('-').map(Number);
        const fromDate = new Date(fy, fm - 1, fd, 0, 0, 0, 0);
        where.visit_date.gte = fromDate;
      }
      if (dateTo) {
        const [ty, tm, td] = dateTo.split('-').map(Number);
        const toDate = new Date(ty, tm - 1, td, 23, 59, 59, 999);
        where.visit_date.lte = toDate;
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
      const categoryIds = expenseData.expense_items.map(
        (it: any) => it.expense_category_id,
      );
      const categoriesCount = await this.prisma.expenseCategory.count({
        where: { id: { in: categoryIds }, deleted_at: null },
      });
      if (categoriesCount !== new Set(categoryIds).size) {
        throw new BadRequestException(
          'One or more expense category IDs are invalid',
        );
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

    const isServiceEngineer = user && user.role === 'Service Engineer';
    const expenseType = expenseData.expense_type || 'MILL';

    if (expenseType === 'OTHERS') {
      if (expenseData.service_report_id || expenseData.installation_report_id) {
        throw new BadRequestException(
          'An expense of type OTHERS cannot be linked to a service report or installation report',
        );
      }
    }

    // Validate role-based eligibility
    if (isServiceEngineer) {
      if (expenseData.service_report_id && expenseData.installation_report_id) {
        throw new BadRequestException(
          'An expense can only be linked to a service report OR an installation report, not both',
        );
      }

      if (expenseType !== 'OTHERS') {
        const reportsCount = await this.prisma.serviceReport.count({
          where: {
            deleted_at: null,
            technicians: { some: { technician_id: user.userId } },
          },
        });
        const installCount = await this.prisma.installationReport.count({
          where: {
            deleted_at: null,
            technicians: { some: { technician_id: user.userId } },
          },
        });
        if (reportsCount === 0 && installCount === 0) {
          throw new ForbiddenException(
            'You are not eligible to create expenses because you have no assigned service or installation reports.',
          );
        }
      }
    }

    // Validate required fields when no report is linked
    if (!expenseData.service_report_id && !expenseData.installation_report_id) {
      if (!expenseData.visit_date) {
        throw new BadRequestException(
          'Visit date is required when no report is linked',
        );
      }
      if (expenseType === 'MILL') {
        if (!expenseData.mill_id) {
          throw new BadRequestException(
            'Mill ID is required for MILL type expense when no report is linked',
          );
        }
      }
    }

    // Verify report duplicate linkage (no two active expenses for the same report)
    if (expenseData.service_report_id) {
      const duplicateExpense = await this.prisma.expense.findFirst({
        where: {
          service_report_id: expenseData.service_report_id,
          deleted_at: null,
        },
      });
      if (duplicateExpense) {
        throw new BadRequestException(
          'An active expense has already been created for this service report',
        );
      }
    }
    if (expenseData.installation_report_id) {
      const duplicateExpense = await this.prisma.expense.findFirst({
        where: {
          installation_report_id: expenseData.installation_report_id,
          deleted_at: null,
        },
      });
      if (duplicateExpense) {
        throw new BadRequestException(
          'An active expense has already been created for this installation report',
        );
      }
    }

    let linkedMillId = expenseData.mill_id;
    let linkedPlace = expenseData.place;
    let linkedVisitDate = expenseData.visit_date;

    if (expenseData.service_report_id) {
      const report = await this.prisma.serviceReport.findFirst({
        where: {
          id: expenseData.service_report_id,
          deleted_at: null,
          ...(isServiceEngineer
            ? { technicians: { some: { technician_id: user.userId } } }
            : {}),
        },
      });
      if (!report) {
        throw new BadRequestException(
          'Linked service report is invalid or not assigned to you',
        );
      }
      linkedMillId = report.mill_id;
      linkedPlace = report.place;
      if (!linkedVisitDate) {
        linkedVisitDate = report.visit_date.toISOString().split('T')[0];
      }
    } else if (expenseData.installation_report_id) {
      const report = await this.prisma.installationReport.findFirst({
        where: {
          id: expenseData.installation_report_id,
          deleted_at: null,
          ...(isServiceEngineer
            ? { technicians: { some: { technician_id: user.userId } } }
            : {}),
        },
      });
      if (!report) {
        throw new BadRequestException(
          'Linked installation report is invalid or not assigned to you',
        );
      }
      linkedMillId = report.mill_id;
      linkedPlace = report.place;
      if (!linkedVisitDate) {
        linkedVisitDate = report.visit_date.toISOString().split('T')[0];
      }
    }

    if (linkedVisitDate) {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (new Date(linkedVisitDate) > today) {
        throw new BadRequestException('Expense date cannot be in the future');
      }
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
      const rootCategoryId = firstItem
        ? firstItem.expense_category_id
        : expenseData.expense_category_id || null;
      const totalAmount = items.length
        ? items.reduce(
            (sum: number, it: any) => sum + Number(it.amount || 0),
            0,
          )
        : Number(expenseData.amount || 0);
      const totalAdminAmount = items.length
        ? items.reduce(
            (sum: number, it: any) => sum + Number(it.admin_amount || 0),
            0,
          )
        : Number(expenseData.admin_amount || 0);
      const rootRemarks = firstItem
        ? firstItem.remarks || expenseData.remarks || null
        : expenseData.remarks || null;
      const rootImages = items.length
        ? Array.from(
            new Set(items.flatMap((it: any) => it.expense_images || [])),
          )
        : expenseData.expense_images || [];

      // Determine report_type
      const report_type = expenseData.service_report_id
        ? 'SERVICE'
        : expenseData.installation_report_id
          ? 'INSTALLATION'
          : 'NONE';

      // Insert the expense record
      const created = await tx.expense.create({
        data: {
          expense_number,
          expense_type: expenseData.expense_type || 'MILL',
          report_type,
          visit_date: new Date(linkedVisitDate),
          visit_time: getAutoVisitTime(),
          expense_category_id: rootCategoryId,
          place: linkedPlace || null,
          others: expenseData.others || null,
          remarks: rootRemarks,
          amount: String(totalAmount),
          admin_amount: String(totalAdminAmount),
          status: expenseData.status || 'PENDING',
          expense_images: rootImages,
          mill_id: linkedMillId || null,
          service_report_id: expenseData.service_report_id || null,
          installation_report_id: expenseData.installation_report_id || null,
        },
      });

      // Sync expense ID back to report table
      if (expenseData.service_report_id) {
        await tx.serviceReport.update({
          where: { id: expenseData.service_report_id },
          data: { expense_id: created.id },
        });
      } else if (expenseData.installation_report_id) {
        await tx.installationReport.update({
          where: { id: expenseData.installation_report_id },
          data: { expense_id: created.id },
        });
      }

      // Create ExpenseItems if provided
      if (items.length > 0) {
        await tx.expenseItem.createMany({
          data: items.map((it: any) => ({
            expense_id: created.id,
            expense_category_id: it.expense_category_id,
            amount: String(Number(it.amount || 0)),
            admin_amount: String(Number(it.admin_amount || 0)),
            remarks: it.remarks || null,
            admin_remarks: it.admin_remarks || null,
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

    const isServiceEngineer = user && user.role === 'Service Engineer';

    // Determine target report IDs and expense type for validation
    const finalServiceReportId =
      expenseData.service_report_id !== undefined
        ? expenseData.service_report_id
        : existingExpense.service_report_id;

    const finalInstallationReportId =
      expenseData.installation_report_id !== undefined
        ? expenseData.installation_report_id
        : existingExpense.installation_report_id;

    const targetExpenseType =
      expenseData.expense_type !== undefined
        ? expenseData.expense_type
        : existingExpense.expense_type;

    if (targetExpenseType === 'OTHERS') {
      if (finalServiceReportId || finalInstallationReportId) {
        throw new BadRequestException(
          'An expense of type OTHERS cannot be linked to a service report or installation report',
        );
      }
    }

    if (isServiceEngineer) {
      if (finalServiceReportId && finalInstallationReportId) {
        throw new BadRequestException(
          'An expense can only be linked to a service report OR an installation report, not both',
        );
      }

      if (targetExpenseType !== 'OTHERS') {
        const reportsCount = await this.prisma.serviceReport.count({
          where: {
            deleted_at: null,
            technicians: { some: { technician_id: user.userId } },
          },
        });
        const installCount = await this.prisma.installationReport.count({
          where: {
            deleted_at: null,
            technicians: { some: { technician_id: user.userId } },
          },
        });
        if (reportsCount === 0 && installCount === 0) {
          throw new ForbiddenException(
            'You are not eligible to update expenses because you have no assigned service or installation reports.',
          );
        }
      }
    }

    // If no report is linked, validate visit_date and mill_id (if MILL type)
    if (!finalServiceReportId && !finalInstallationReportId) {
      const targetVisitDate =
        expenseData.visit_date !== undefined
          ? expenseData.visit_date
          : existingExpense.visit_date;
      if (!targetVisitDate) {
        throw new BadRequestException(
          'Visit date is required when no report is linked',
        );
      }

      if (targetExpenseType === 'MILL') {
        const targetMillId =
          expenseData.mill_id !== undefined
            ? expenseData.mill_id
            : existingExpense.mill_id;
        if (!targetMillId) {
          throw new BadRequestException(
            'Mill ID is required for MILL type expense when no report is linked',
          );
        }
      }
    }

    // Verify report duplicate linkage (no two active expenses for the same report)
    if (
      expenseData.service_report_id &&
      typeof expenseData.service_report_id === 'string'
    ) {
      const duplicateExpense = await this.prisma.expense.findFirst({
        where: {
          service_report_id: expenseData.service_report_id,
          deleted_at: null,
          NOT: { id },
        },
      });
      if (duplicateExpense) {
        throw new BadRequestException(
          'An active expense has already been created for this service report',
        );
      }
    }
    if (
      expenseData.installation_report_id &&
      typeof expenseData.installation_report_id === 'string'
    ) {
      const duplicateExpense = await this.prisma.expense.findFirst({
        where: {
          installation_report_id: expenseData.installation_report_id,
          deleted_at: null,
          NOT: { id },
        },
      });
      if (duplicateExpense) {
        throw new BadRequestException(
          'An active expense has already been created for this installation report',
        );
      }
    }
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
      const categoryIds = expenseData.expense_items.map(
        (it: any) => it.expense_category_id,
      );
      const categoriesCount = await this.prisma.expenseCategory.count({
        where: { id: { in: categoryIds }, deleted_at: null },
      });
      if (categoriesCount !== new Set(categoryIds).size) {
        throw new BadRequestException(
          'One or more expense category IDs are invalid',
        );
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
    if (expenseData.expense_type !== undefined) {
      updateData.expense_type = expenseData.expense_type;
    }

    if (targetExpenseType === 'OTHERS') {
      updateData.service_report_id = null;
      updateData.installation_report_id = null;
    } else {
      if (expenseData.service_report_id !== undefined) {
        if (expenseData.service_report_id === null) {
          updateData.service_report_id = null;
        } else {
          const report = await this.prisma.serviceReport.findFirst({
            where: {
              id: expenseData.service_report_id,
              deleted_at: null,
              ...(user && user.role === 'Service Engineer'
                ? { technicians: { some: { technician_id: user.userId } } }
                : {}),
            },
          });
          if (!report) {
            throw new BadRequestException(
              'Linked service report is invalid or not assigned to you',
            );
          }
          updateData.service_report_id = expenseData.service_report_id;
          updateData.mill_id = report.mill_id;
          updateData.place = report.place;
          if (expenseData.visit_date === undefined) {
            updateData.visit_date = report.visit_date;
          }
        }
      }

      if (expenseData.installation_report_id !== undefined) {
        if (expenseData.installation_report_id === null) {
          updateData.installation_report_id = null;
        } else {
          const report = await this.prisma.installationReport.findFirst({
            where: {
              id: expenseData.installation_report_id,
              deleted_at: null,
              ...(user && user.role === 'Service Engineer'
                ? { technicians: { some: { technician_id: user.userId } } }
                : {}),
            },
          });
          if (!report) {
            throw new BadRequestException(
              'Linked installation report is invalid or not assigned to you',
            );
          }
          updateData.installation_report_id =
            expenseData.installation_report_id;
          updateData.mill_id = report.mill_id;
          updateData.place = report.place;
          if (expenseData.visit_date === undefined) {
            updateData.visit_date = report.visit_date;
          }
        }
      }
    }

    const finalVisitDate =
      updateData.visit_date !== undefined
        ? updateData.visit_date
        : expenseData.visit_date !== undefined
          ? new Date(expenseData.visit_date)
          : undefined;

    if (finalVisitDate) {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (finalVisitDate > today) {
        throw new BadRequestException('Expense date cannot be in the future');
      }
    }

    // Calculate aggregated items fields
    const hasItems = expenseData.expense_items !== undefined;
    if (hasItems) {
      const items = expenseData.expense_items || [];
      const firstItem = items[0];
      updateData.expense_category_id = firstItem
        ? firstItem.expense_category_id
        : null;
      const totalAmount = items.reduce(
        (sum: number, it: any) => sum + Number(it.amount || 0),
        0,
      );
      updateData.amount = String(totalAmount);
      const totalAdminAmount = items.reduce(
        (sum: number, it: any) => sum + Number(it.admin_amount || 0),
        0,
      );
      updateData.admin_amount = String(totalAdminAmount);
      updateData.remarks = firstItem ? firstItem.remarks || null : null;
      updateData.expense_images = Array.from(
        new Set(items.flatMap((it: any) => it.expense_images || [])),
      );
    } else {
      // Legacy updates
      if (expenseData.expense_category_id !== undefined) {
        updateData.expense_category_id = expenseData.expense_category_id;
      }
      if (expenseData.amount !== undefined) {
        updateData.amount = expenseData.amount
          ? String(expenseData.amount)
          : '0';
      }
      if (expenseData.admin_amount !== undefined) {
        updateData.admin_amount = expenseData.admin_amount
          ? String(expenseData.admin_amount)
          : '0';
      }
      if (expenseData.remarks !== undefined) {
        updateData.remarks = expenseData.remarks || null;
      }
      if (expenseData.expense_images !== undefined) {
        updateData.expense_images = expenseData.expense_images;
      }
    }
    // Determine report_type
    const currentServiceReportId =
      updateData.service_report_id !== undefined
        ? updateData.service_report_id
        : existingExpense.service_report_id;
    const currentInstallationReportId =
      updateData.installation_report_id !== undefined
        ? updateData.installation_report_id
        : existingExpense.installation_report_id;

    updateData.report_type = currentServiceReportId
      ? 'SERVICE'
      : currentInstallationReportId
        ? 'INSTALLATION'
        : 'NONE';

    const expense = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.expense.update({
        where: { id },
        data: updateData,
        include: INCLUDE_SHAPE,
      });

      // Sync report changes
      if (
        existingExpense.service_report_id &&
        existingExpense.service_report_id !== updated.service_report_id
      ) {
        await tx.serviceReport.update({
          where: { id: existingExpense.service_report_id },
          data: { expense_id: null },
        });
      }
      if (
        existingExpense.installation_report_id &&
        existingExpense.installation_report_id !==
          updated.installation_report_id
      ) {
        await tx.installationReport.update({
          where: { id: existingExpense.installation_report_id },
          data: { expense_id: null },
        });
      }
      if (
        updated.service_report_id &&
        updated.service_report_id !== existingExpense.service_report_id
      ) {
        await tx.serviceReport.update({
          where: { id: updated.service_report_id },
          data: { expense_id: updated.id },
        });
      }
      if (
        updated.installation_report_id &&
        updated.installation_report_id !==
          existingExpense.installation_report_id
      ) {
        await tx.installationReport.update({
          where: { id: updated.installation_report_id },
          data: { expense_id: updated.id },
        });
      }

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
              amount: String(Number(it.amount || 0)),
              admin_amount: String(Number(it.admin_amount || 0)),
              remarks: it.remarks || null,
              admin_remarks: it.admin_remarks || null,
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
              expense_category_id:
                updateData.expense_category_id !== undefined
                  ? updateData.expense_category_id
                  : undefined,
              amount:
                updateData.amount !== undefined ? updateData.amount : undefined,
              admin_amount:
                updateData.admin_amount !== undefined
                  ? updateData.admin_amount
                  : undefined,
              remarks:
                updateData.remarks !== undefined
                  ? updateData.remarks
                  : undefined,
              expense_images:
                updateData.expense_images !== undefined
                  ? updateData.expense_images
                  : undefined,
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

    const expense = await this.prisma.$transaction(async (tx) => {
      const deleted = await tx.expense.update({
        where: { id },
        data: { deleted_at: new Date() },
        include: INCLUDE_SHAPE,
      });

      // Clear expense_id on any linked report
      if (deleted.service_report_id) {
        await tx.serviceReport.update({
          where: { id: deleted.service_report_id },
          data: { expense_id: null },
        });
      }
      if (deleted.installation_report_id) {
        await tx.installationReport.update({
          where: { id: deleted.installation_report_id },
          data: { expense_id: null },
        });
      }

      return deleted;
    });

    await this.invalidateCache(id);
    return expense;
  }

  async checkEligibility(
    user: { userId: string; role: string },
    technicianId?: string,
    excludeExpenseId?: string,
  ) {
    const isServiceEngineer = user.role === 'Service Engineer';
    const targetUserId = isServiceEngineer ? user.userId : technicianId;

    if (!targetUserId) {
      return {
        eligible: !isServiceEngineer,
        serviceReports: [],
        installationReports: [],
      };
    }

    const serviceReports = await this.prisma.serviceReport.findMany({
      where: {
        deleted_at: null,
        technicians: {
          some: {
            technician_id: targetUserId,
          },
        },
        OR: [
          { expense_id: null },
          ...(excludeExpenseId ? [{ expense_id: excludeExpenseId }] : []),
        ],
        expenses: {
          none: {
            deleted_at: null,
            ...(excludeExpenseId ? { NOT: { id: excludeExpenseId } } : {}),
          },
        },
      },
      select: {
        id: true,
        report_number: true,
        mill_id: true,
        place: true,
        visit_date: true,
        mill: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const installationReports = await this.prisma.installationReport.findMany({
      where: {
        deleted_at: null,
        technicians: {
          some: {
            technician_id: targetUserId,
          },
        },
        OR: [
          { expense_id: null },
          ...(excludeExpenseId ? [{ expense_id: excludeExpenseId }] : []),
        ],
        expenses: {
          none: {
            deleted_at: null,
            ...(excludeExpenseId ? { NOT: { id: excludeExpenseId } } : {}),
          },
        },
      },
      select: {
        id: true,
        report_number: true,
        mill_id: true,
        place: true,
        visit_date: true,
        mill: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return {
      eligible: true,
      serviceReports: serviceReports.map((r) => ({
        id: r.id,
        report_number: r.report_number,
        mill_id: r.mill_id,
        place: r.place,
        visit_date: r.visit_date,
        mill_name: r.mill?.name || 'Unknown Mill',
      })),
      installationReports: installationReports.map((r) => ({
        id: r.id,
        report_number: r.report_number,
        mill_id: r.mill_id,
        place: r.place,
        visit_date: r.visit_date,
        mill_name: r.mill?.name || 'Unknown Mill',
      })),
    };
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
