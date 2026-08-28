import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../../prisma/prisma.service';
import { RedisService } from '../../../redis/redis.service';
export declare class ActivityLogProcessor extends WorkerHost {
    private prisma;
    private redis;
    private readonly logger;
    private readonly BATCH_SIZE;
    private batchBuffer;
    private flushInterval;
    constructor(prisma: PrismaService, redis: RedisService);
    process(job: Job<any>): Promise<any>;
    private flushBuffer;
    onCompleted(job: Job): void;
    onFailed(job: Job, error: Error): void;
    onModuleDestroy(): Promise<void>;
}
