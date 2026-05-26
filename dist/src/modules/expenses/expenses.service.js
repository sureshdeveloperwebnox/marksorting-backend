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
const prisma_service_1 = require("../../prisma/prisma.service");
const redis_service_1 = require("../../redis/redis.service");
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
    CACHE_PREFIX = 'expense:';
    LIST_CACHE_KEY = 'expenses:list:';
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
    }
    async findAll(params) {
        const cacheKey = `${this.LIST_CACHE_KEY}${JSON.stringify(params)}`;
        const cachedData = await this.redis.getJson(cacheKey);
        if (cachedData)
            return cachedData;
        const { skip, take, search, status, dateFrom, dateTo } = params;
        const where = { deleted_at: null };
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
        await this.redis.setJson(cacheKey, result, 300);
        return result;
    }
    async findById(id) {
        const cacheKey = `${this.CACHE_PREFIX}id:${id}`;
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
        await this.redis.setJson(cacheKey, expense, 3600);
        return expense;
    }
    async create(dto) {
        const { technician_ids, ...expenseData } = dto;
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
                data: technician_ids.map((tid) => ({
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
        return expense;
    }
    async update(id, dto) {
        await this.findById(id);
        const { technician_ids, ...expenseData } = dto;
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
    async remove(id) {
        await this.findById(id);
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
        ];
        if (id) {
            promises.push(this.redis.del(`${this.CACHE_PREFIX}id:${id}`));
        }
        await Promise.all(promises);
    }
};
exports.ExpensesService = ExpensesService;
exports.ExpensesService = ExpensesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], ExpensesService);
//# sourceMappingURL=expenses.service.js.map