"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpensesService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("../../prisma/prisma.service");
const redis_service_1 = require("../../redis/redis.service");
const s3_service_1 = require("../../shared/services/s3.service");
const INCLUDE_SHAPE = {
    mill: { select: { id: true, name: true } },
    expenseCategory: { select: { id: true, name: true } },
    technicians: {
        include: { technician: { select: { id: true, full_name: true } } },
    },
};
let ExpensesService = class ExpensesService {
    prisma;
    redis;
    eventEmitter;
    s3Service;
    CACHE_PREFIX = 'expense:';
    LIST_CACHE_KEY = 'expenses:list:';
    constructor(prisma, redis, eventEmitter, s3Service) {
        this.prisma = prisma;
        this.redis = redis;
        this.eventEmitter = eventEmitter;
        this.s3Service = s3Service;
    }
    mapExpenseImageUrls(expense) {
        if (!expense)
            return expense;
        return {
            ...expense,
            expense_images: (expense.expense_images || []).map((key) => {
                if (key.startsWith('http'))
                    return key;
                return this.s3Service.getFileUrl(key);
            }),
        };
    }
    mapExpensesImageUrls(expenses) {
        return expenses.map(expense => this.mapExpenseImageUrls(expense));
    }
    async findAll(params, user) {
        const cacheKey = `${this.LIST_CACHE_KEY}${JSON.stringify({ params, user })}`;
        const cachedData = await this.redis.getJson(cacheKey);
        if (cachedData)
            return cachedData;
        const { skip, take, search, status, technicianId, dateFrom, dateTo } = params;
        const where = { deleted_at: null };
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
        if (technicianId) {
            if (user && user.role === 'Service Engineer') {
                where.technicians = {
                    some: {
                        technician_id: user.userId,
                    },
                };
            }
            else {
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
        const expensesWithUrls = this.mapExpensesImageUrls(expenses);
        const result = { expenses: expensesWithUrls, total };
        await this.redis.setJson(cacheKey, result, 300);
        return result;
    }
    async findById(id, user) {
        const cacheKey = `${this.CACHE_PREFIX}id:${id}:${user?.userId || 'all'}`;
        const cached = await this.redis.getJson(cacheKey);
        if (cached)
            return cached;
        const expense = await this.prisma.expense.findFirst({
            where: { id, deleted_at: null },
            include: INCLUDE_SHAPE,
        });
        if (!expense) {
            throw new common_1.NotFoundException(`Expense with ID "${id}" not found`);
        }
        if (user && user.role === 'Service Engineer') {
            const isAssigned = expense.technicians.some((t) => t.technician_id === user.userId);
            if (!isAssigned) {
                throw new common_1.ForbiddenException('You do not have permission to access this expense');
            }
        }
        const expenseWithUrls = this.mapExpenseImageUrls(expense);
        await this.redis.setJson(cacheKey, expenseWithUrls, 3600);
        return expenseWithUrls;
    }
    async create(dto, user) {
        const rawDto = dto;
        const { technician_ids, ...expenseData } = rawDto;
        delete expenseData.customer_id;
        delete expenseData.technician_id;
        const finalTechnicianIds = [...(technician_ids || [])];
        if (rawDto.technician_id && !finalTechnicianIds.includes(rawDto.technician_id)) {
            finalTechnicianIds.push(rawDto.technician_id);
        }
        if (user &&
            user.role === 'Service Engineer' &&
            !finalTechnicianIds.includes(user.userId)) {
            finalTechnicianIds.push(user.userId);
        }
        const categoryExists = await this.prisma.expenseCategory.findFirst({
            where: { id: expenseData.expense_category_id, deleted_at: null },
        });
        if (!categoryExists) {
            throw new common_1.BadRequestException(`Expense category with ID "${expenseData.expense_category_id}" not found`);
        }
        if (expenseData.mill_id) {
            const millExists = await this.prisma.mill.findFirst({
                where: { id: expenseData.mill_id, deleted_at: null },
            });
            if (!millExists) {
                throw new common_1.BadRequestException(`Mill with ID "${expenseData.mill_id}" not found`);
            }
        }
        if (finalTechnicianIds.length > 0) {
            const techniciansCount = await this.prisma.technician.count({
                where: { id: { in: finalTechnicianIds }, deleted_at: null },
            });
            if (techniciansCount !== finalTechnicianIds.length) {
                throw new common_1.BadRequestException('One or more technician IDs are invalid');
            }
        }
        else {
            throw new common_1.BadRequestException('At least one technician ID is required');
        }
        const expense = await this.prisma.$transaction(async (tx) => {
            const todayStart = new Date();
            todayStart.setUTCHours(0, 0, 0, 0);
            const todayEnd = new Date();
            todayEnd.setUTCHours(23, 59, 59, 999);
            const count = await tx.expense.count({
                where: { created_at: { gte: todayStart, lte: todayEnd } },
            });
            const dateStr = todayStart.toISOString().slice(0, 10).replace(/-/g, '');
            const seq = String(count + 1);
            const expense_number = `EXP-${dateStr}-${seq}`;
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
            await tx.expenseTechnician.createMany({
                data: finalTechnicianIds.map((tid) => ({
                    expense_id: created.id,
                    technician_id: tid,
                })),
            });
            return tx.expense.findFirst({
                where: { id: created.id },
                include: INCLUDE_SHAPE,
            });
        });
        await this.invalidateCache();
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
    async update(id, dto, user) {
        const existingExpense = await this.findById(id, user);
        const rawDto = dto;
        const { technician_ids, ...expenseData } = rawDto;
        delete expenseData.customer_id;
        delete expenseData.technician_id;
        let finalTechnicianIds = technician_ids !== undefined ? [...technician_ids] : undefined;
        if (rawDto.technician_id !== undefined) {
            if (finalTechnicianIds !== undefined) {
                if (rawDto.technician_id && !finalTechnicianIds.includes(rawDto.technician_id)) {
                    finalTechnicianIds.push(rawDto.technician_id);
                }
            }
            else {
                finalTechnicianIds = rawDto.technician_id ? [rawDto.technician_id] : [];
            }
        }
        if (expenseData.expense_category_id !== undefined) {
            const categoryExists = await this.prisma.expenseCategory.findFirst({
                where: { id: expenseData.expense_category_id, deleted_at: null },
            });
            if (!categoryExists) {
                throw new common_1.BadRequestException(`Expense category with ID "${expenseData.expense_category_id}" not found`);
            }
        }
        if (expenseData.mill_id !== undefined && expenseData.mill_id !== null) {
            const millExists = await this.prisma.mill.findFirst({
                where: { id: expenseData.mill_id, deleted_at: null },
            });
            if (!millExists) {
                throw new common_1.BadRequestException(`Mill with ID "${expenseData.mill_id}" not found`);
            }
        }
        if (finalTechnicianIds !== undefined && finalTechnicianIds.length > 0) {
            const techniciansCount = await this.prisma.technician.count({
                where: { id: { in: finalTechnicianIds }, deleted_at: null },
            });
            if (techniciansCount !== finalTechnicianIds.length) {
                throw new common_1.BadRequestException('One or more technician IDs are invalid');
            }
        }
        const updateData = {};
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
        if (dto.status && expense) {
            const technicianUserIds = expense.technicians?.map((t) => t.technician_id) ?? [];
            this.eventEmitter.emit('expense.status_updated', {
                expenseNumber: expense.expense_number,
                status: expense.status,
                technicianUserIds,
            });
        }
        return { before: existingExpense, after: expense };
    }
    async remove(id, user) {
        await this.findById(id, user);
        const expense = await this.prisma.expense.update({
            where: { id },
            data: { deleted_at: new Date() },
            include: INCLUDE_SHAPE,
        });
        await this.invalidateCache(id);
        return expense;
    }
    async invalidateCache(id) {
        const promises = [
            this.redis.delByPrefix(this.LIST_CACHE_KEY),
            this.redis.delByPrefix('reports:'),
        ];
        if (id) {
            promises.push(this.redis.delByPrefix(`${this.CACHE_PREFIX}id:${id}`));
        }
        await Promise.all(promises);
    }
};
exports.ExpensesService = ExpensesService;
exports.ExpensesService = ExpensesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        event_emitter_1.EventEmitter2,
        s3_service_1.S3Service])
], ExpensesService);
//# sourceMappingURL=expenses.service.js.map