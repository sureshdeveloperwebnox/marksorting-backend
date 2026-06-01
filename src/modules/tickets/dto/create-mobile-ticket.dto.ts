import { OmitType } from '@nestjs/swagger';
import { CreateTicketDto } from './create-ticket.dto';
import { IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMobileTicketDto extends OmitType(CreateTicketDto, [
  'service_engineer_id',
] as const) {
  @ApiProperty({
    example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    required: false,
    description:
      'Single technician / service engineer UUID assigned to this support ticket (optional). ' +
      'If not provided, the logged-in engineer ID is automatically assigned.',
  })
  @IsUUID()
  @IsOptional()
  service_engineer_id?: string;
}
