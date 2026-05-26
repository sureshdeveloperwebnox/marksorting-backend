import { PartialType } from '@nestjs/swagger';
import { CreateInstallationReportDto } from './create-installation-report.dto';

export class UpdateInstallationReportDto extends PartialType(
  CreateInstallationReportDto,
) {}
