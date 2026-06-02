import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../../prisma/prisma.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { MailModule } from '../mail/mail.module';
import { ServiceReportsModule } from '../service-reports/service-reports.module';
import { InstallationReportsModule } from '../installation-reports/installation-reports.module';
import { ReportNotificationsService } from './report-notifications.service';
import { ReportNotificationsEventListener } from './report-notifications.event-listener';
import { ReportNotificationsController } from './report-notifications.controller';

@Module({
  imports: [
    PrismaModule,
    WhatsAppModule,
    MailModule,
    ServiceReportsModule,
    InstallationReportsModule,
    BullModule.registerQueue({
      name: 'report-notifications',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: {
          age: 86400,
          count: 500,
        },
        removeOnFail: {
          age: 604800,
          count: 200,
        },
      },
    }),
    BullModule.registerQueue({
      name: 'mail',
    }),
  ],
  controllers: [ReportNotificationsController],
  providers: [ReportNotificationsService, ReportNotificationsEventListener],
  exports: [ReportNotificationsService],
})
export class ReportNotificationsModule {}
