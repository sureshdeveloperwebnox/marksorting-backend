import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { RedisModule } from '../../redis/redis.module';
import { PdfModule } from '../pdf/pdf.module';
import { SettingsModule } from '../settings/settings.module';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';

@Module({
  imports: [PrismaModule, RedisModule, PdfModule, SettingsModule],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
