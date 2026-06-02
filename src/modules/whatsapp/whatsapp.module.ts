import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppProcessor } from './whatsapp.processor';
import { WhatsAppRabbitMQService } from './whatsapp-rabbitmq.service';
import { WhatsAppRabbitMQProcessor } from './whatsapp-rabbitmq.processor';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
    BullModule.registerQueue({
      name: 'whatsapp',
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 10000,
        },
        removeOnComplete: {
          age: 86400,
          count: 1000,
        },
        removeOnFail: {
          age: 604800,
          count: 500,
        },
      },
    }),
  ],
  providers: [
    WhatsAppService,
    WhatsAppProcessor,
    WhatsAppRabbitMQService,
    WhatsAppRabbitMQProcessor,
  ],
  exports: [WhatsAppService, WhatsAppRabbitMQService],
})
export class WhatsAppModule {}
