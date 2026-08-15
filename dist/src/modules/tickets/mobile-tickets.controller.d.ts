import { TicketsService } from './tickets.service';
import { CreateMobileTicketDto } from './dto/create-mobile-ticket.dto';
import { UpdateMobileTicketDto } from './dto/update-mobile-ticket.dto';
export declare class MobileTicketsController {
    private readonly ticketsService;
    constructor(ticketsService: TicketsService);
    findAll(req: any, skip?: string, take?: string, search?: string, status?: string, priority?: string, dateFrom?: string, dateTo?: string, startDate?: string, endDate?: string): Promise<any>;
    findOne(id: string, req: any): Promise<any>;
    create(dto: CreateMobileTicketDto, req: any): Promise<any>;
    update(id: string, dto: UpdateMobileTicketDto, req: any): Promise<{
        before: any;
        after: any;
    }>;
    remove(id: string, req: any): Promise<any>;
}
