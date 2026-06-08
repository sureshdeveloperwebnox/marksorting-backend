import { TicketsService } from './tickets.service';
import { CreateMobileTicketDto } from './dto/create-mobile-ticket.dto';
import { UpdateMobileTicketDto } from './dto/update-mobile-ticket.dto';
export declare class MobileTicketsController {
    private readonly ticketsService;
    constructor(ticketsService: TicketsService);
    findAll(req: any, skip?: string, take?: string, search?: string, status?: string, priority?: string): Promise<any>;
    findOne(id: string, req: any): Promise<any>;
    create(dto: CreateMobileTicketDto, req: any): Promise<{
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
    update(id: string, dto: UpdateMobileTicketDto, req: any): Promise<{
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
    remove(id: string, req: any): Promise<{
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
}
