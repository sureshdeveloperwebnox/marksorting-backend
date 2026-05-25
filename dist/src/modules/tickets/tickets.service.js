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
exports.TicketsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const redis_service_1 = require("../../redis/redis.service");
const INCLUDE_SHAPE = {
    service_engineer: {
        select: {
            id: true,
            full_name: true,
            email: true,
            phone: true,
            status: true,
        }
    },
    customer: {
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
        }
    },
    mill: {
        select: {
            id: true,
            name: true,
        }
    },
};
let TicketsService = class TicketsService {
    prisma;
    redis;
    CACHE_PREFIX = 'ticket:';
    LIST_CACHE_KEY = 'tickets:list:';
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
    }
    async findAll(params) {
        const cacheKey = `${this.LIST_CACHE_KEY}${JSON.stringify(params)}`;
        const cachedData = await this.redis.getJson(cacheKey);
        if (cachedData)
            return cachedData;
        const { skip, take, search, status, priority } = params;
        const where = {};
        if (search) {
            where.OR = [
                { ticket_number: { contains: search, mode: 'insensitive' } },
                { subject: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { service_engineer: { full_name: { contains: search, mode: 'insensitive' } } },
                { service_engineer: { email: { contains: search, mode: 'insensitive' } } },
                { customer: { name: { contains: search, mode: 'insensitive' } } },
                { customer: { email: { contains: search, mode: 'insensitive' } } },
                { mill: { name: { contains: search, mode: 'insensitive' } } },
            ];
        }
        if (status) {
            where.status = status;
        }
        if (priority) {
            where.priority = priority;
        }
        const [tickets, total] = await Promise.all([
            this.prisma.supportTicket.findMany({
                skip,
                take,
                where,
                include: INCLUDE_SHAPE,
                orderBy: { created_at: 'desc' },
            }),
            this.prisma.supportTicket.count({ where }),
        ]);
        const result = { tickets, total };
        await this.redis.setJson(cacheKey, result, 300);
        return result;
    }
    async findById(id) {
        const cacheKey = `${this.CACHE_PREFIX}id:${id}`;
        const cached = await this.redis.getJson(cacheKey);
        if (cached)
            return cached;
        const ticket = await this.prisma.supportTicket.findUnique({
            where: { id },
            include: INCLUDE_SHAPE,
        });
        if (!ticket) {
            throw new common_1.NotFoundException(`Support ticket with ID "${id}" not found`);
        }
        await this.redis.setJson(cacheKey, ticket, 3600);
        return ticket;
    }
    async create(dto) {
        await this.validateTicketRelations({
            service_engineer_id: dto.service_engineer_id,
            customer_id: dto.customer_id,
            mill_id: dto.mill_id,
        });
        const ticket = await this.createWithUniqueTicketNumber(dto);
        await this.invalidateCache();
        return ticket;
    }
    async update(id, dto) {
        const existing = await this.findById(id);
        const nextCustomerId = dto.customer_id ?? existing.customer_id;
        const nextMillId = Object.prototype.hasOwnProperty.call(dto, 'mill_id')
            ? this.normalizeNullableId(dto.mill_id)
            : existing.mill_id;
        await this.validateTicketRelations({
            service_engineer_id: dto.service_engineer_id ?? existing.service_engineer_id,
            customer_id: nextCustomerId,
            mill_id: nextMillId,
        });
        const ticket = await this.prisma.supportTicket.update({
            where: { id },
            data: this.normalizePayload(dto),
            include: INCLUDE_SHAPE,
        });
        await this.invalidateCache(id);
        return ticket;
    }
    async remove(id) {
        await this.findById(id);
        const ticket = await this.prisma.supportTicket.delete({
            where: { id },
            include: INCLUDE_SHAPE,
        });
        await this.invalidateCache(id);
        return ticket;
    }
    async invalidateCache(id) {
        const promises = [this.redis.delByPrefix(this.LIST_CACHE_KEY)];
        if (id) {
            promises.push(this.redis.del(`${this.CACHE_PREFIX}id:${id}`));
        }
        await Promise.all(promises);
    }
    normalizePayload(dto) {
        return {
            ...dto,
            mill_id: this.normalizeNullableId(dto.mill_id),
        };
    }
    normalizeNullableId(value) {
        return value === '' ? null : value;
    }
    async createWithUniqueTicketNumber(dto) {
        for (let attempt = 0; attempt < 5; attempt += 1) {
            try {
                return await this.prisma.supportTicket.create({
                    data: {
                        ...this.normalizePayload(dto),
                        ticket_number: this.generateTicketNumber(),
                    },
                    include: INCLUDE_SHAPE,
                });
            }
            catch (error) {
                if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                    error.code === 'P2002' &&
                    this.isTicketNumberConflict(error)) {
                    continue;
                }
                throw error;
            }
        }
        throw new common_1.BadRequestException('Could not generate a unique ticket ID');
    }
    isTicketNumberConflict(error) {
        const target = error.meta?.target;
        return Array.isArray(target)
            ? target.includes('ticket_number')
            : target === 'ticket_number' || target === 'support_tickets_ticket_number_key';
    }
    generateTicketNumber() {
        const now = new Date();
        const yyyymmdd = now.toISOString().slice(0, 10).replace(/-/g, '');
        const random = Math.random().toString(36).slice(2, 8).toUpperCase();
        return `TKT-${yyyymmdd}-${random}`;
    }
    async validateTicketRelations(params) {
        const { service_engineer_id, customer_id, mill_id } = params;
        if (!service_engineer_id) {
            throw new common_1.BadRequestException('Service engineer is required');
        }
        if (!customer_id) {
            throw new common_1.BadRequestException('Customer is required');
        }
        const [serviceEngineer, customer] = await Promise.all([
            this.prisma.technician.findFirst({
                where: { id: service_engineer_id, deleted_at: null },
            }),
            this.prisma.customer.findFirst({
                where: { id: customer_id, deleted_at: null },
            }),
        ]);
        if (!serviceEngineer) {
            throw new common_1.NotFoundException('Service engineer not found');
        }
        if (!customer) {
            throw new common_1.NotFoundException('Customer not found');
        }
        if (!mill_id) {
            return;
        }
        const mill = await this.prisma.mill.findFirst({
            where: { id: mill_id, deleted_at: null },
        });
        if (!mill) {
            throw new common_1.NotFoundException('Mill not found');
        }
        if (mill.customer_id !== customer_id) {
            throw new common_1.BadRequestException('Selected mill does not belong to the selected customer');
        }
    }
};
exports.TicketsService = TicketsService;
exports.TicketsService = TicketsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], TicketsService);
//# sourceMappingURL=tickets.service.js.map