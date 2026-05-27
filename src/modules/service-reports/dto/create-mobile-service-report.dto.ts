import { OmitType } from '@nestjs/swagger';
import { CreateServiceReportDto } from './create-service-report.dto';
import { IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
}
