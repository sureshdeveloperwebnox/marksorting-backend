import { CreateTicketDto } from './create-ticket.dto';
declare const CreateMobileTicketDto_base: import("@nestjs/common").Type<Omit<CreateTicketDto, "service_engineer_id">>;
export declare class CreateMobileTicketDto extends CreateMobileTicketDto_base {
    service_engineer_id?: string;
}
export {};
