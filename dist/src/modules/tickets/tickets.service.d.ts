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
    }): Promise<{
        mill: {
            id: string;
            name: string;
        } | null;
        customer: {
            id: string;
            email: string | null;
            name: string;
            phone: string | null;
        } | null;
        service_engineer: {
            id: string;
            full_name: string;
            email: string | null;
            status: string;
            phone: string | null;
        } | null;
    } & {
        id: string;
        user_id: string | null;
        description: string;
        created_at: Date;
        updated_at: Date;
        mill_id: string | null;
        status: string;
        customer_id: string | null;
        ticket_number: string | null;
        service_engineer_id: string | null;
        subject: string;
        priority: string;
    }>;
    update(id: string, dto: UpdateTicketDto | UpdateMobileTicketDto, user?: {
        userId: string;
        role: string;
    }): Promise<{
        before: any;
        after: {
            mill: {
                id: string;
                name: string;
            } | null;
            customer: {
                id: string;
                email: string | null;
                name: string;
                phone: string | null;
            } | null;
            service_engineer: {
                id: string;
                full_name: string;
                email: string | null;
                status: string;
                phone: string | null;
            } | null;
        } & {
            id: string;
            user_id: string | null;
            description: string;
            created_at: Date;
            updated_at: Date;
            mill_id: string | null;
            status: string;
            customer_id: string | null;
            ticket_number: string | null;
            service_engineer_id: string | null;
            subject: string;
            priority: string;
        };
    }>;
    remove(id: string, user?: {
        userId: string;
        role: string;
    }): Promise<{
        mill: {
            id: string;
            name: string;
        } | null;
        customer: {
            id: string;
            email: string | null;
            name: string;
            phone: string | null;
        } | null;
        service_engineer: {
            id: string;
            full_name: string;
            email: string | null;
            status: string;
            phone: string | null;
        } | null;
    } & {
        id: string;
        user_id: string | null;
        description: string;
        created_at: Date;
        updated_at: Date;
        mill_id: string | null;
        status: string;
        customer_id: string | null;
        ticket_number: string | null;
        service_engineer_id: string | null;
        subject: string;
        priority: string;
    }>;
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
    }): Promise<{
        user: {
            id: string;
            full_name: string;
            email: string;
        };
    } & {
        id: string;
        user_id: string;
        created_at: Date;
        updated_at: Date;
        status: string | null;
        ticket_id: string;
        notes: string;
        timeline_date: Date;
        next_follow_up_date: Date | null;
    }>;
    getTimelines(ticketId: string): Promise<({
        user: {
            id: string;
            full_name: string;
            email: string;
        };
    } & {
        id: string;
        user_id: string;
        created_at: Date;
        updated_at: Date;
        status: string | null;
        ticket_id: string;
        notes: string;
        timeline_date: Date;
        next_follow_up_date: Date | null;
    })[]>;
}
