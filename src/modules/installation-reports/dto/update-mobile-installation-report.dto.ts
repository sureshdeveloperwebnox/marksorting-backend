import { PartialType } from '@nestjs/swagger';
import { CreateMobileInstallationReportDto } from './create-mobile-installation-report.dto';

export class UpdateMobileInstallationReportDto extends PartialType(
  CreateMobileInstallationReportDto,
) {}
