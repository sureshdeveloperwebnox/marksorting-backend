import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { CreateTimelineDto } from './dto/create-timeline.dto';
export declare class TicketsController {
    private readonly ticketsService;
    constructor(ticketsService: TicketsService);
    findAll(skip?: string, take?: string, search?: string, status?: string, priority?: string): Promise<any>;
    findOne(id: string): Promise<any>;
    create(dto: CreateTicketDto): Promise<{
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
    update(id: string, dto: UpdateTicketDto): Promise<{
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
    remove(id: string): Promise<{
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
    createTimeline(ticketId: string, dto: CreateTimelineDto, req: any): Promise<{
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
