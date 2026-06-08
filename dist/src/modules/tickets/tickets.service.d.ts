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
        service_engineer: {
            id: string;
            status: string;
            full_name: string;
            email: string | null;
            phone: string | null;
        } | null;
        customer: {
            id: string;
            email: string | null;
            phone: string | null;
            name: string;
        } | null;
        mill: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        ticket_number: string | null;
        user_id: string | null;
        service_engineer_id: string | null;
        customer_id: string | null;
        mill_id: string | null;
        subject: string;
        description: string;
        status: string;
        priority: string;
        created_at: Date;
        updated_at: Date;
    }>;
    update(id: string, dto: UpdateTicketDto | UpdateMobileTicketDto, user?: {
        userId: string;
        role: string;
    }): Promise<{
        before: any;
        after: {
            service_engineer: {
                id: string;
                status: string;
                full_name: string;
                email: string | null;
                phone: string | null;
            } | null;
            customer: {
                id: string;
                email: string | null;
                phone: string | null;
                name: string;
            } | null;
            mill: {
                id: string;
                name: string;
            } | null;
        } & {
            id: string;
            ticket_number: string | null;
            user_id: string | null;
            service_engineer_id: string | null;
            customer_id: string | null;
            mill_id: string | null;
            subject: string;
            description: string;
            status: string;
            priority: string;
            created_at: Date;
            updated_at: Date;
        };
    }>;
    remove(id: string, user?: {
        userId: string;
        role: string;
    }): Promise<{
        service_engineer: {
            id: string;
            status: string;
            full_name: string;
            email: string | null;
            phone: string | null;
        } | null;
        customer: {
            id: string;
            email: string | null;
            phone: string | null;
            name: string;
        } | null;
        mill: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        ticket_number: string | null;
        user_id: string | null;
        service_engineer_id: string | null;
        customer_id: string | null;
        mill_id: string | null;
        subject: string;
        description: string;
        status: string;
        priority: string;
        created_at: Date;
        updated_at: Date;
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
        status: string | null;
        created_at: Date;
        updated_at: Date;
        notes: string;
        timeline_date: Date;
        next_follow_up_date: Date | null;
        ticket_id: string;
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
        status: string | null;
        created_at: Date;
        updated_at: Date;
        notes: string;
        timeline_date: Date;
        next_follow_up_date: Date | null;
        ticket_id: string;
    })[]>;
}
