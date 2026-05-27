import { OmitType } from '@nestjs/swagger';
import { CreateInstallationReportDto } from './create-installation-report.dto';
import { IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMobileInstallationReportDto extends OmitType(
  CreateInstallationReportDto,
  ['technician_ids'] as const,
) {
  @ApiProperty({
    example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    required: false,
    description:
      'Single technician UUID assigned to this installation report (optional). Used by the mobile client.',
  })
  @IsUUID()
  @IsOptional()
  technician_id?: string;
}
