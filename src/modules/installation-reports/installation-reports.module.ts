import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { RedisModule } from '../../redis/redis.module';
import { PdfModule } from '../pdf/pdf.module';
import { SettingsModule } from '../settings/settings.module';
import { InstallationReportsService } from './installation-reports.service';
import { InstallationReportsController } from './installation-reports.controller';
import { MobileInstallationReportsController } from './mobile-installation-reports.controller';
import { InstallationReportsBulkService } from './installation-reports-bulk.service';
import { InstallationReportsBulkController } from './installation-reports-bulk.controller';
import { InstallationReportsExcelParserService } from './installation-reports-excel-parser.service';

@Module({
  imports: [PrismaModule, RedisModule, PdfModule, SettingsModule],
  controllers: [
    InstallationReportsController,
    MobileInstallationReportsController,
    InstallationReportsBulkController,
  ],
  providers: [
    InstallationReportsService,
    InstallationReportsBulkService,
    InstallationReportsExcelParserService,
  ],
  exports: [InstallationReportsService],
})
export class InstallationReportsModule {}
