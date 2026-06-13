import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { CreateTimelineDto } from './dto/create-timeline.dto';
export declare class TicketsController {
    private readonly ticketsService;
    constructor(ticketsService: TicketsService);
    findAll(skip?: string, take?: string, search?: string, status?: string, priority?: string): Promise<any>;
    findOne(id: string): Promise<any>;
    create(dto: CreateTicketDto, req: any): Promise<{
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
    update(id: string, dto: UpdateTicketDto, req: any): Promise<{
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
    createTimeline(ticketId: string, dto: CreateTimelineDto, req: any): Promise<{
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
        notes: string;
        next_follow_up_date: Date | null;
        timeline_date: Date;
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
        created_at: Date;
        updated_at: Date;
        status: string | null;
        notes: string;
        next_follow_up_date: Date | null;
        timeline_date: Date;
        ticket_id: string;
    })[]>;
}
