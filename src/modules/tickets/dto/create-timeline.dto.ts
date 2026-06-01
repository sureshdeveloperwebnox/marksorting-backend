import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTimelineDto {
  @ApiProperty({ example: 'Discussed the sorting machine printer issue with the customer. Order placed for spare parts.' })
  @IsString()
  @IsNotEmpty()
  notes: string;

  @ApiProperty({ example: '2026-06-05T09:00:00.000Z', required: false })
  @IsDateString()
  @IsOptional()
  next_follow_up_date?: string;

  @ApiProperty({ example: '2026-06-01T11:00:00.000Z', required: false })
  @IsDateString()
  @IsOptional()
  timeline_date?: string;

  @ApiProperty({ example: 'IN_PROGRESS', enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED'], required: false })
  @IsString()
  @IsOptional()
  status?: string;
}
