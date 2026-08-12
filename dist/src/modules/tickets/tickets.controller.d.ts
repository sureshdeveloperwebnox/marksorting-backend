import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { CreateTimelineDto } from './dto/create-timeline.dto';
export declare class TicketsController {
    private readonly ticketsService;
    constructor(ticketsService: TicketsService);
    findAll(skip?: string, take?: string, search?: string, status?: string, priority?: string, dateFrom?: string, dateTo?: string): Promise<any>;
    findOne(id: string): Promise<any>;
    create(dto: CreateTicketDto, req: any): Promise<any>;
    update(id: string, dto: UpdateTicketDto, req: any): Promise<{
        before: any;
        after: any;
    }>;
    remove(id: string): Promise<any>;
    createTimeline(ticketId: string, dto: CreateTimelineDto, req: any): Promise<any>;
    getTimelines(ticketId: string): Promise<any>;
}
