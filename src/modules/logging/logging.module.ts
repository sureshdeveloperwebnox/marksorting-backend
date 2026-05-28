import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LogQueueService, LogQueue } from './services/log-queue.service';
import { ActivityLogService } from './services/activity-log.service';
import { SecurityLogService } from './services/security-log.service';
import { ActivityLogProcessor } from './processors/activity-log.processor';
import { ActivityLogInterceptor } from './interceptors/activity-log.interceptor';
import { CorrelationIdMiddleware } from './middleware/correlation-id.middleware';
import { RequestLoggerMiddleware } from './middleware/request-logger.middleware';
import { RedisModule } from '../../redis/redis.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Global()
@Module({
  imports: [
    BullModule.registerQueue(
      { name: LogQueue.ACTIVITY },
      { name: LogQueue.AUDIT },
      { name: LogQueue.SECURITY },
      { name: LogQueue.API },
      { name: LogQueue.ERROR },
    ),
    RedisModule,
    PrismaModule,
  ],
  providers: [
    LogQueueService,
    ActivityLogService,
    SecurityLogService,
    ActivityLogProcessor,
    ActivityLogInterceptor,
    CorrelationIdMiddleware,
    RequestLoggerMiddleware,
  ],
  exports: [
    LogQueueService,
    ActivityLogService,
    SecurityLogService,
    ActivityLogInterceptor,
    CorrelationIdMiddleware,
    RequestLoggerMiddleware,
  ],
})
export class LoggingModule {}
