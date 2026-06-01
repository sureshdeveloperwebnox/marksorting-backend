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
const event_emitter_1 = require("@nestjs/event-emitter");
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
        },
    },
    customer: {
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
        },
    },
    mill: {
        select: {
            id: true,
            name: true,
        },
    },
};
let TicketsService = class TicketsService {
    prisma;
    redis;
    eventEmitter;
    CACHE_PREFIX = 'ticket:';
    LIST_CACHE_KEY = 'tickets:list:';
    constructor(prisma, redis, eventEmitter) {
        this.prisma = prisma;
        this.redis = redis;
        this.eventEmitter = eventEmitter;
    }
    async findAll(params, user) {
        const cacheKey = `${this.LIST_CACHE_KEY}${JSON.stringify({ params, user })}`;
        const cachedData = await this.redis.getJson(cacheKey);
        if (cachedData)
            return cachedData;
        const { skip, take, search, status, priority } = params;
        const where = {};
        if (user && user.role === 'Service Engineer') {
            where.service_engineer_id = user.userId;
        }
        if (search) {
            where.OR = [
                { ticket_number: { contains: search, mode: 'insensitive' } },
                { subject: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                {
                    service_engineer: {
                        full_name: { contains: search, mode: 'insensitive' },
                    },
                },
                {
                    service_engineer: {
                        email: { contains: search, mode: 'insensitive' },
                    },
                },
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
    async findById(id, user) {
        const cacheKey = `${this.CACHE_PREFIX}id:${id}:${user?.userId || 'all'}`;
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
        if (user && user.role === 'Service Engineer') {
            if (ticket.service_engineer_id !== user.userId) {
                throw new common_1.ForbiddenException('You do not have permission to access this ticket');
            }
        }
        await this.redis.setJson(cacheKey, ticket, 3600);
        return ticket;
    }
    async create(dto, user) {
        const rawDto = dto;
        let service_engineer_id = rawDto.service_engineer_id;
        if (user && user.role === 'Service Engineer') {
            service_engineer_id = user.userId;
        }
        await this.validateTicketRelations({
            service_engineer_id,
            customer_id: dto.customer_id,
            mill_id: dto.mill_id,
        });
        const ticket = await this.createWithUniqueTicketNumber({
            ...dto,
            service_engineer_id,
        });
        await this.invalidateCache();
        const assignedIds = service_engineer_id ? [service_engineer_id] : [];
        this.eventEmitter.emit('ticket.created', {
            ticketNumber: ticket.ticket_number,
            subject: ticket.subject,
            assignedTechnicianUserIds: assignedIds,
        });
        return ticket;
    }
    async update(id, dto, user) {
        const existing = await this.findById(id, user);
        const nextCustomerId = dto.customer_id ?? existing.customer_id;
        const nextMillId = Object.prototype.hasOwnProperty.call(dto, 'mill_id')
            ? this.normalizeNullableId(dto.mill_id)
            : existing.mill_id;
        const rawDto = dto;
        let nextServiceEngineerId = rawDto.service_engineer_id ?? existing.service_engineer_id;
        if (user && user.role === 'Service Engineer') {
            nextServiceEngineerId = user.userId;
        }
        await this.validateTicketRelations({
            service_engineer_id: nextServiceEngineerId,
            customer_id: nextCustomerId,
            mill_id: nextMillId,
        });
        const ticket = await this.prisma.supportTicket.update({
            where: { id },
            data: {
                ...this.normalizePayload(dto),
                service_engineer_id: nextServiceEngineerId,
            },
            include: INCLUDE_SHAPE,
        });
        await this.invalidateCache(id);
        if (nextServiceEngineerId &&
            nextServiceEngineerId !== existing.service_engineer_id) {
            this.eventEmitter.emit('ticket.assigned', {
                ticketNumber: ticket.ticket_number,
                subject: ticket.subject,
                assignedTechnicianUserIds: [nextServiceEngineerId],
            });
        }
        return { before: existing, after: ticket };
    }
    async remove(id, user) {
        await this.findById(id, user);
        const ticket = await this.prisma.supportTicket.delete({
            where: { id },
            include: INCLUDE_SHAPE,
        });
        await this.invalidateCache(id);
        return ticket;
    }
    async invalidateCache(id) {
        const promises = [
            this.redis.delByPrefix(this.LIST_CACHE_KEY),
        ];
        if (id) {
            promises.push(this.redis.delByPrefix(`${this.CACHE_PREFIX}id:${id}`));
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
            : target === 'ticket_number' ||
                target === 'support_tickets_ticket_number_key';
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
        redis_service_1.RedisService,
        event_emitter_1.EventEmitter2])
], TicketsService);
//# sourceMappingURL=tickets.service.js.map