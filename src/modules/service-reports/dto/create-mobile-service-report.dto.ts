import { OmitType, ApiProperty } from '@nestjs/swagger';
import { CreateServiceReportDto } from './create-service-report.dto';
import { IsOptional, IsUUID, IsArray } from 'class-validator';

export class CreateMobileServiceReportDto extends OmitType(
  CreateServiceReportDto,
  ['technician_ids'] as const,
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
}
