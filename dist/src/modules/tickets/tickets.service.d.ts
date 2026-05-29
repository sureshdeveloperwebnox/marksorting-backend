import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
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
    }): Promise<any>;
    findById(id: string): Promise<any>;
    create(dto: CreateTicketDto): Promise<{
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
            phone: string | null;
            status: string;
        } | null;
    } & {
        id: string;
        user_id: string | null;
        description: string;
        created_at: Date;
        updated_at: Date;
        status: string;
        mill_id: string | null;
        customer_id: string | null;
        priority: string;
        subject: string;
        service_engineer_id: string | null;
        ticket_number: string | null;
    }>;
    update(id: string, dto: UpdateTicketDto): Promise<{
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
                phone: string | null;
                status: string;
            } | null;
        } & {
            id: string;
            user_id: string | null;
            description: string;
            created_at: Date;
            updated_at: Date;
            status: string;
            mill_id: string | null;
            customer_id: string | null;
            priority: string;
            subject: string;
            service_engineer_id: string | null;
            ticket_number: string | null;
        };
    }>;
    remove(id: string): Promise<{
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
            phone: string | null;
            status: string;
        } | null;
    } & {
        id: string;
        user_id: string | null;
        description: string;
        created_at: Date;
        updated_at: Date;
        status: string;
        mill_id: string | null;
        customer_id: string | null;
        priority: string;
        subject: string;
        service_engineer_id: string | null;
        ticket_number: string | null;
    }>;
    private invalidateCache;
    private normalizePayload;
    private normalizeNullableId;
    private createWithUniqueTicketNumber;
    private isTicketNumberConflict;
    private generateTicketNumber;
    private validateTicketRelations;
}
