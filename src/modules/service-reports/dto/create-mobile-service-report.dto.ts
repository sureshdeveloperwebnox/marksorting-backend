import { OmitType, ApiProperty } from '@nestjs/swagger';
import { CreateServiceReportDto } from './create-service-report.dto';
import { IsOptional, IsUUID, IsArray, IsDateString } from 'class-validator';

export class CreateMobileServiceReportDto extends OmitType(
  CreateServiceReportDto,
  ['technician_ids', 'visit_date'] as const,
) {
  @ApiProperty({
    example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    required: false,
    description:
      'Single technician UUID assigned to this service report (optional). Used by the mobile client.',
  })
  @IsUUID()
  @IsOptional()
  technician_id?: string;

  @ApiProperty({
    example: ['xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'],
    required: false,
    type: [String],
    description:
      'Multiple technician UUIDs assigned to this service report (optional).',
  })
  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  technician_ids?: string[];

  @ApiProperty({
    example: '2024-06-15',
    required: false,
    description:
      'Visit date in YYYY-MM-DD format (optional). Defaults to current date if omitted.',
  })
  @IsDateString()
  @IsOptional()
  visit_date?: string;
}
