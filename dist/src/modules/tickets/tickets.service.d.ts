import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
export declare class TicketsService {
    private prisma;
    private redis;
    private readonly CACHE_PREFIX;
    private readonly LIST_CACHE_KEY;
    constructor(prisma: PrismaService, redis: RedisService);
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
            name: string;
            id: string;
        } | null;
        customer: {
            email: string | null;
            name: string;
            id: string;
            phone: string | null;
        } | null;
        service_engineer: {
            full_name: string;
            email: string | null;
            id: string;
            status: string;
            phone: string | null;
        } | null;
    } & {
        description: string;
        id: string;
        created_at: Date;
        updated_at: Date;
        status: string;
        customer_id: string | null;
        mill_id: string | null;
        service_engineer_id: string | null;
        subject: string;
        priority: string;
        ticket_number: string | null;
        user_id: string | null;
    }>;
    update(id: string, dto: UpdateTicketDto): Promise<{
        mill: {
            name: string;
            id: string;
        } | null;
        customer: {
            email: string | null;
            name: string;
            id: string;
            phone: string | null;
        } | null;
        service_engineer: {
            full_name: string;
            email: string | null;
            id: string;
            status: string;
            phone: string | null;
        } | null;
    } & {
        description: string;
        id: string;
        created_at: Date;
        updated_at: Date;
        status: string;
        customer_id: string | null;
        mill_id: string | null;
        service_engineer_id: string | null;
        subject: string;
        priority: string;
        ticket_number: string | null;
        user_id: string | null;
    }>;
    remove(id: string): Promise<{
        mill: {
            name: string;
            id: string;
        } | null;
        customer: {
            email: string | null;
            name: string;
            id: string;
            phone: string | null;
        } | null;
        service_engineer: {
            full_name: string;
            email: string | null;
            id: string;
            status: string;
            phone: string | null;
        } | null;
    } & {
        description: string;
        id: string;
        created_at: Date;
        updated_at: Date;
        status: string;
        customer_id: string | null;
        mill_id: string | null;
        service_engineer_id: string | null;
        subject: string;
        priority: string;
        ticket_number: string | null;
        user_id: string | null;
    }>;
    private invalidateCache;
    private normalizePayload;
    private normalizeNullableId;
    private createWithUniqueTicketNumber;
    private isTicketNumberConflict;
    private generateTicketNumber;
    private validateTicketRelations;
}
