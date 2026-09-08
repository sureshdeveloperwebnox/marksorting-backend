import { OmitType } from '@nestjs/swagger';
import { CreateInstallationReportDto } from './create-installation-report.dto';
import { IsOptional, IsUUID, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateMobileInstallationReportDto extends OmitType(
  CreateInstallationReportDto,
  ['technician_ids', 'visit_date', 'visit_time'] as const,
) {
  @ApiProperty({
    example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    required: false,
    description:
      'Single technician UUID assigned to this installation report (optional). Used by the mobile client.',
  })
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  @IsUUID()
  @IsOptional()
  technician_id?: string;

  @ApiProperty({
    example: ['xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'],
    required: false,
    type: [String],
    description:
      'Multiple technician UUIDs assigned to this installation report (optional).',
  })
  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  technician_ids?: string[];
}

