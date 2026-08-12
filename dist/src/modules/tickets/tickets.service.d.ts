import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { CreateMobileTicketDto } from './dto/create-mobile-ticket.dto';
import { UpdateMobileTicketDto } from './dto/update-mobile-ticket.dto';
import { CreateTimelineDto } from './dto/create-timeline.dto';
export declare class TicketsService {
    private prisma;
    private redis;
    private eventEmitter;
    private readonly CACHE_PREFIX;
    private readonly LIST_CACHE_KEY;
    constructor(prisma: PrismaService, redis: RedisService, eventEmitter: EventEmitter2);
    findAll(params: {
        skip?: number;
        take?: number;
        search?: string;
        status?: string;
        priority?: string;
        dateFrom?: string;
        dateTo?: string;
    }, user?: {
        userId: string;
        role: string;
    }): Promise<any>;
    findById(id: string, user?: {
        userId: string;
        role: string;
    }): Promise<any>;
    create(dto: CreateTicketDto | CreateMobileTicketDto, user?: {
        userId: string;
        role: string;
    }): Promise<any>;
    update(id: string, dto: UpdateTicketDto | UpdateMobileTicketDto, user?: {
        userId: string;
        role: string;
    }): Promise<{
        before: any;
        after: any;
    }>;
    remove(id: string, user?: {
        userId: string;
        role: string;
    }): Promise<any>;
    private invalidateCache;
    private normalizePayload;
    private normalizeNullableId;
    private createWithUniqueTicketNumber;
    private isTicketNumberConflict;
    private generateTicketNumber;
    private validateTicketRelations;
    createTimeline(ticketId: string, dto: CreateTimelineDto, user: {
        userId: string;
        role: string;
    }): Promise<any>;
    getTimelines(ticketId: string): Promise<any>;
}
