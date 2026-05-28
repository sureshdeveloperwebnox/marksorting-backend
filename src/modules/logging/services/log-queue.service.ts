import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

export enum LogQueue {
  ACTIVITY = 'activity-logs',
  AUDIT = 'audit-logs',
  SECURITY = 'security-logs',
  API = 'api-logs',
  ERROR = 'error-logs',
  JOB = 'job-logs',
  NOTIFICATION = 'notification-logs',
}

export interface LogJobOptions {
  priority?: number;
  delay?: number;
  attempts?: number;
}

@Injectable()
export class LogQueueService {
  private readonly logger = new Logger(LogQueueService.name);

  constructor(
    @InjectQueue(LogQueue.ACTIVITY) private activityQueue: Queue,
    @InjectQueue(LogQueue.AUDIT) private auditQueue: Queue,
    @InjectQueue(LogQueue.SECURITY) private securityQueue: Queue,
    @InjectQueue(LogQueue.API) private apiQueue: Queue,
    @InjectQueue(LogQueue.ERROR) private errorQueue: Queue,
  ) {}

  async addActivityLog(data: any, options: LogJobOptions = {}) {
    return this.activityQueue.add('activity-log', data, {
      priority: options.priority ?? 5,
      attempts: options.attempts ?? 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: { age: 3600 },
      removeOnFail: { age: 86400 },
    });
  }

  async addAuditTrail(data: any, options: LogJobOptions = {}) {
    return this.auditQueue.add('audit-trail', data, {
      priority: options.priority ?? 10,
      attempts: options.attempts ?? 5,
      backoff: { type: 'fixed', delay: 2000 },
    });
  }

  async addSecurityLog(data: any, options: LogJobOptions = {}) {
    return this.securityQueue.add('security-log', data, {
      priority: options.priority ?? 10,
      attempts: options.attempts ?? 5,
      backoff: { type: 'fixed', delay: 1000 },
    });
  }

  async addApiLog(data: any, options: LogJobOptions = {}) {
    return this.apiQueue.add('api-log', data, {
      priority: options.priority ?? 1,
      attempts: options.attempts ?? 2,
      removeOnComplete: { count: 1000 },
    });
  }

  async addErrorLog(data: any, options: LogJobOptions = {}) {
    return this.errorQueue.add('error-log', data, {
      priority: options.priority ?? 10,
      attempts: options.attempts ?? 5,
      delay: options.delay ?? 500,
    });
  }

  // Bulk insert for high-volume scenarios
  async addBulkActivityLogs(logs: any[]) {
    const jobs = logs.map((log) => ({
      name: 'activity-log',
      data: log,
      opts: { priority: 1 },
    }));
    return this.activityQueue.addBulk(jobs);
  }

  // Queue metrics for monitoring
  async getQueueMetrics() {
    return {
      activity: {
        waiting: await this.activityQueue.getWaitingCount(),
        active: await this.activityQueue.getActiveCount(),
        completed: await this.activityQueue.getCompletedCount(),
        failed: await this.activityQueue.getFailedCount(),
      },
      audit: {
        waiting: await this.auditQueue.getWaitingCount(),
        active: await this.auditQueue.getActiveCount(),
        completed: await this.auditQueue.getCompletedCount(),
        failed: await this.auditQueue.getFailedCount(),
      },
      security: {
        waiting: await this.securityQueue.getWaitingCount(),
        active: await this.securityQueue.getActiveCount(),
        completed: await this.securityQueue.getCompletedCount(),
        failed: await this.securityQueue.getFailedCount(),
      },
    };
  }
}
