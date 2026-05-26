import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { RedisModule } from '../../redis/redis.module';
import { PdfModule } from '../pdf/pdf.module';
import { SettingsModule } from '../settings/settings.module';
import { ServiceReportsService } from './service-reports.service';
import { ServiceReportsController } from './service-reports.controller';

@Module({
  imports: [PrismaModule, RedisModule, PdfModule, SettingsModule],
  controllers: [ServiceReportsController],
  providers: [ServiceReportsService],
  exports: [ServiceReportsService],
})
export class ServiceReportsModule {}
