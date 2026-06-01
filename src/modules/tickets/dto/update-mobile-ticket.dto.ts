import { PartialType } from '@nestjs/swagger';
import { CreateMobileTicketDto } from './create-mobile-ticket.dto';

export class UpdateMobileTicketDto extends PartialType(CreateMobileTicketDto) {}
