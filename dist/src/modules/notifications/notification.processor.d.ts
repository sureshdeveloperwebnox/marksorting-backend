import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
export declare class NotificationProcessor extends WorkerHost {
    private configService;
    private prisma;
    private readonly logger;
    private firebaseApp;
    private firebaseInitialized;
    private firebaseMockMode;
    constructor(configService: ConfigService, prisma: PrismaService);
    private initFirebase;
    process(job: Job<any>): Promise<void>;
    sendPush(data: {
        id?: string;
        userId: string;
        title: string;
        message: string;
        type: any;
        recordId?: string;
        metaData?: Record<string, any>;
    }): Promise<void>;
}
