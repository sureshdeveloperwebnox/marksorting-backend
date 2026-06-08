import { TicketsService } from './tickets.service';
import { CreateMobileTicketDto } from './dto/create-mobile-ticket.dto';
import { UpdateMobileTicketDto } from './dto/update-mobile-ticket.dto';
export declare class MobileTicketsController {
    private readonly ticketsService;
    constructor(ticketsService: TicketsService);
    findAll(req: any, skip?: string, take?: string, search?: string, status?: string, priority?: string): Promise<any>;
    findOne(id: string, req: any): Promise<any>;
    create(dto: CreateMobileTicketDto, req: any): Promise<{
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
        created_at: Date;
        updated_at: Date;
        description: string;
        user_id: string | null;
        status: string;
        customer_id: string | null;
        mill_id: string | null;
        priority: string;
        subject: string;
        ticket_number: string | null;
        service_engineer_id: string | null;
    }>;
    update(id: string, dto: UpdateMobileTicketDto, req: any): Promise<{
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
            created_at: Date;
            updated_at: Date;
            description: string;
            user_id: string | null;
            status: string;
            customer_id: string | null;
            mill_id: string | null;
            priority: string;
            subject: string;
            ticket_number: string | null;
            service_engineer_id: string | null;
        };
    }>;
    remove(id: string, req: any): Promise<{
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
        created_at: Date;
        updated_at: Date;
        description: string;
        user_id: string | null;
        status: string;
        customer_id: string | null;
        mill_id: string | null;
        priority: string;
        subject: string;
        ticket_number: string | null;
        service_engineer_id: string | null;
    }>;
}
