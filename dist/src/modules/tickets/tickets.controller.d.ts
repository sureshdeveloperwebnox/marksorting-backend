import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { CreateTimelineDto } from './dto/create-timeline.dto';
export declare class TicketsController {
    private readonly ticketsService;
    constructor(ticketsService: TicketsService);
    findAll(skip?: string, take?: string, search?: string, status?: string, priority?: string, dateFrom?: string, dateTo?: string): Promise<any>;
    findOne(id: string): Promise<any>;
    create(dto: CreateTicketDto, req: any): Promise<{
        mill: {
            id: string;
            name: string;
        } | null;
        customer: {
            id: string;
            name: string;
            email: string | null;
            phone: string | null;
        } | null;
        service_engineer: {
            id: string;
            status: string;
            full_name: string;
            email: string | null;
            phone: string | null;
        } | null;
    } & {
        id: string;
        description: string;
        status: string;
        created_at: Date;
        updated_at: Date;
        mill_id: string | null;
        user_id: string | null;
        customer_id: string | null;
        ticket_number: string | null;
        service_engineer_id: string | null;
        subject: string;
        priority: string;
    }>;
    update(id: string, dto: UpdateTicketDto, req: any): Promise<{
        before: any;
        after: {
            mill: {
                id: string;
                name: string;
            } | null;
            customer: {
                id: string;
                name: string;
                email: string | null;
                phone: string | null;
            } | null;
            service_engineer: {
                id: string;
                status: string;
                full_name: string;
                email: string | null;
                phone: string | null;
            } | null;
        } & {
            id: string;
            description: string;
            status: string;
            created_at: Date;
            updated_at: Date;
            mill_id: string | null;
            user_id: string | null;
            customer_id: string | null;
            ticket_number: string | null;
            service_engineer_id: string | null;
            subject: string;
            priority: string;
        };
    }>;
    remove(id: string): Promise<{
        mill: {
            id: string;
            name: string;
        } | null;
        customer: {
            id: string;
            name: string;
            email: string | null;
            phone: string | null;
        } | null;
        service_engineer: {
            id: string;
            status: string;
            full_name: string;
            email: string | null;
            phone: string | null;
        } | null;
    } & {
        id: string;
        description: string;
        status: string;
        created_at: Date;
        updated_at: Date;
        mill_id: string | null;
        user_id: string | null;
        customer_id: string | null;
        ticket_number: string | null;
        service_engineer_id: string | null;
        subject: string;
        priority: string;
    }>;
    createTimeline(ticketId: string, dto: CreateTimelineDto, req: any): Promise<{
        user: {
            id: string;
            full_name: string;
            email: string;
        };
    } & {
        id: string;
        status: string | null;
        created_at: Date;
        updated_at: Date;
        user_id: string;
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
        status: string | null;
        created_at: Date;
        updated_at: Date;
        user_id: string;
        ticket_id: string;
        notes: string;
        timeline_date: Date;
        next_follow_up_date: Date | null;
    })[]>;
}
