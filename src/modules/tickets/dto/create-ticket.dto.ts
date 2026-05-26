import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsIn,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTicketDto {
  @ApiProperty({ example: 'uuid-of-service-engineer' })
  @IsUUID()
  service_engineer_id: string;

  @ApiProperty({ example: 'uuid-of-customer' })
  @IsUUID()
  customer_id: string;

  @ApiProperty({ example: 'uuid-of-mill', required: false })
  @IsUUID()
  @IsOptional()
  mill_id?: string;

  @ApiProperty({ example: 'Printer not responding' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({
    example:
      'The sorting machine printer is not printing reports and displays error code E-24.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    example: 'OPEN',
    enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED'],
    required: false,
    default: 'OPEN',
  })
  @IsIn(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED'])
  @IsOptional()
  status?: string;

  @ApiProperty({
    example: 'MEDIUM',
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    required: false,
    default: 'MEDIUM',
  })
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  @IsOptional()
  priority?: string;
}
