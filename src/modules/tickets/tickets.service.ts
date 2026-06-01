import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { CreateMobileTicketDto } from './dto/create-mobile-ticket.dto';
import { UpdateMobileTicketDto } from './dto/update-mobile-ticket.dto';

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
} as const;

@Injectable()
export class TicketsService {
  private readonly CACHE_PREFIX = 'ticket:';
  private readonly LIST_CACHE_KEY = 'tickets:list:';

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private eventEmitter: EventEmitter2,
  ) {}

  async findAll(
    params: {
      skip?: number;
      take?: number;
      search?: string;
      status?: string;
      priority?: string;
    },
    user?: { userId: string; role: string },
  ) {
    const cacheKey = `${this.LIST_CACHE_KEY}${JSON.stringify({ params, user })}`;
    const cachedData = await this.redis.getJson<any>(cacheKey);
    if (cachedData) return cachedData;

    const { skip, take, search, status, priority } = params;

    const where: any = {};

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
    await this.redis.setJson(cacheKey, result, 300); // Cache for 5 mins
    return result;
  }

  async findById(id: string, user?: { userId: string; role: string }) {
    const cacheKey = `${this.CACHE_PREFIX}id:${id}:${user?.userId || 'all'}`;
    const cached = await this.redis.getJson<any>(cacheKey);
    if (cached) return cached;

    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: INCLUDE_SHAPE,
    });

    if (!ticket) {
      throw new NotFoundException(`Support ticket with ID "${id}" not found`);
    }

    if (user && user.role === 'Service Engineer') {
      if (ticket.service_engineer_id !== user.userId) {
        throw new ForbiddenException(
          'You do not have permission to access this ticket',
        );
      }
    }

    await this.redis.setJson(cacheKey, ticket, 3600); // Cache for 1 hour
    return ticket;
  }

  async create(
    dto: CreateTicketDto | CreateMobileTicketDto,
    user?: { userId: string; role: string },
  ) {
    const rawDto = dto as any;
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

  async update(
    id: string,
    dto: UpdateTicketDto | UpdateMobileTicketDto,
    user?: { userId: string; role: string },
  ) {
    const existing = await this.findById(id, user);
    const nextCustomerId = dto.customer_id ?? existing.customer_id;
    const nextMillId = Object.prototype.hasOwnProperty.call(dto, 'mill_id')
      ? this.normalizeNullableId(dto.mill_id)
      : existing.mill_id;

    const rawDto = dto as any;
    let nextServiceEngineerId =
      rawDto.service_engineer_id ?? existing.service_engineer_id;

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

    if (
      nextServiceEngineerId &&
      nextServiceEngineerId !== existing.service_engineer_id
    ) {
      this.eventEmitter.emit('ticket.assigned', {
        ticketNumber: ticket.ticket_number,
        subject: ticket.subject,
        assignedTechnicianUserIds: [nextServiceEngineerId],
      });
    }

    return { before: existing, after: ticket };
  }

  async remove(id: string, user?: { userId: string; role: string }) {
    await this.findById(id, user);

    const ticket = await this.prisma.supportTicket.delete({
      where: { id },
      include: INCLUDE_SHAPE,
    });

    await this.invalidateCache(id);
    return ticket;
  }

  private async invalidateCache(id?: string) {
    const promises: Promise<any>[] = [
      this.redis.delByPrefix(this.LIST_CACHE_KEY),
    ];
    if (id) {
      promises.push(this.redis.delByPrefix(`${this.CACHE_PREFIX}id:${id}`));
    }
    await Promise.all(promises);
  }

  private normalizePayload<T extends CreateTicketDto | UpdateTicketDto>(
    dto: T,
  ) {
    return {
      ...dto,
      mill_id: this.normalizeNullableId(dto.mill_id),
    };
  }

  private normalizeNullableId(value?: string | null) {
    return value === '' ? null : value;
  }

  private async createWithUniqueTicketNumber(dto: CreateTicketDto) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        return await this.prisma.supportTicket.create({
          data: {
            ...this.normalizePayload(dto),
            ticket_number: this.generateTicketNumber(),
          },
          include: INCLUDE_SHAPE,
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002' &&
          this.isTicketNumberConflict(error)
        ) {
          continue;
        }
        throw error;
      }
    }

    throw new BadRequestException('Could not generate a unique ticket ID');
  }

  private isTicketNumberConflict(error: Prisma.PrismaClientKnownRequestError) {
    const target = error.meta?.target;
    return Array.isArray(target)
      ? target.includes('ticket_number')
      : target === 'ticket_number' ||
          target === 'support_tickets_ticket_number_key';
  }

  private generateTicketNumber() {
    const now = new Date();
    const yyyymmdd = now.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `TKT-${yyyymmdd}-${random}`;
  }

  private async validateTicketRelations(params: {
    service_engineer_id?: string | null;
    customer_id?: string | null;
    mill_id?: string | null;
  }) {
    const { service_engineer_id, customer_id, mill_id } = params;

    if (!service_engineer_id) {
      throw new BadRequestException('Service engineer is required');
    }

    if (!customer_id) {
      throw new BadRequestException('Customer is required');
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
      throw new NotFoundException('Service engineer not found');
    }

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    if (!mill_id) {
      return;
    }

    const mill = await this.prisma.mill.findFirst({
      where: { id: mill_id, deleted_at: null },
    });

    if (!mill) {
      throw new NotFoundException('Mill not found');
    }

    if (mill.customer_id !== customer_id) {
      throw new BadRequestException(
        'Selected mill does not belong to the selected customer',
      );
    }
  }
}
