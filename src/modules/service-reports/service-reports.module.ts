import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { RedisModule } from '../../redis/redis.module';
import { PdfModule } from '../pdf/pdf.module';
import { SettingsModule } from '../settings/settings.module';
import { MasterMillsModule } from '../master-mills/master-mills.module';
import { ServiceReportsService } from './service-reports.service';
import { ServiceReportsController } from './service-reports.controller';
import { MobileServiceReportsController } from './mobile-service-reports.controller';
import { ServiceReportsBulkService } from './service-reports-bulk.service';
import { ServiceReportsBulkController } from './service-reports-bulk.controller';
import { ServiceReportsExcelParserService } from './service-reports-excel-parser.service';

@Module({
  imports: [PrismaModule, RedisModule, PdfModule, SettingsModule, MasterMillsModule],
  controllers: [
    ServiceReportsController,
    MobileServiceReportsController,
    ServiceReportsBulkController,
  ],
  providers: [
    ServiceReportsService,
    ServiceReportsBulkService,
    ServiceReportsExcelParserService,
  ],
  exports: [ServiceReportsService],
})
export class ServiceReportsModule {}

