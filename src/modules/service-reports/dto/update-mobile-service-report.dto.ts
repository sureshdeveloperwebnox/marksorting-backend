import { PartialType } from '@nestjs/swagger';
import { CreateMobileServiceReportDto } from './create-mobile-service-report.dto';

export class UpdateMobileServiceReportDto extends PartialType(
  CreateMobileServiceReportDto,
) {}
