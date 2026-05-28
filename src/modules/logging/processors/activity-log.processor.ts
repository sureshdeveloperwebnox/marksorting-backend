import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { LogQueue } from '../services/log-queue.service';
import { RedisService } from '../../../redis/redis.service';

@Processor(LogQueue.ACTIVITY, {
  concurrency: 10,
  lockDuration: 30000,
})
export class ActivityLogProcessor extends WorkerHost {
  private readonly logger = new Logger(ActivityLogProcessor.name);
  private readonly BATCH_SIZE = 100;
  private batchBuffer: any[] = [];
  private flushInterval: NodeJS.Timeout;

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {
    super();
    this.flushInterval = setInterval(() => this.flushBuffer(), 5000);
  }

  async process(job: Job<any>): Promise<any> {
    try {
      const logData = job.data;
      
      this.batchBuffer.push({
        user_id: logData.userId,
        action: logData.action,
        entity_type: logData.entityType,
        entity_id: logData.entityId,
        description: logData.description,
        metadata: logData.metadata,
        ip_address: logData.ipAddress,
        user_agent: logData.userAgent,
        device_name: logData.deviceName,
        browser: logData.browser,
        os: logData.os,
        correlation_id: logData.correlationId,
        request_id: logData.requestId,
        session_id: logData.sessionId,
        execution_time_ms: logData.executionTimeMs,
        created_at: new Date(),
      });

      if (this.batchBuffer.length >= this.BATCH_SIZE) {
        await this.flushBuffer();
      }

      await this.redis.publish('activity-logs', JSON.stringify({
        type: 'NEW_ACTIVITY_LOG',
        data: logData,
        timestamp: new Date().toISOString(),
      }));

      return { success: true, buffered: this.batchBuffer.length };
    } catch (error) {
      this.logger.error(`Failed to process activity log: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  private async flushBuffer(): Promise<void> {
    if (this.batchBuffer.length === 0) return;

    const logs = [...this.batchBuffer];
    this.batchBuffer = [];

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.activityLog.createMany({
          data: logs,
          skipDuplicates: true,
        });
      });

      this.logger.debug(`Flushed ${logs.length} activity logs to database`);
    } catch (error) {
      this.logger.error(`Failed to flush activity logs: ${(error as Error).message}`);
      this.batchBuffer.unshift(...logs);
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.debug(`Activity log job ${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Activity log job ${job.id} failed: ${error.message}`);
  }

  async onModuleDestroy() {
    clearInterval(this.flushInterval);
    await this.flushBuffer();
  }
}
