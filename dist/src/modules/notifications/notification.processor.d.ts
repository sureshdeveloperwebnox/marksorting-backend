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
    }): Promise<{
        success: boolean;
        mockMode: boolean;
        message: string;
        tokensCount?: undefined;
        successCount?: undefined;
        failureCount?: undefined;
        responses?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        tokensCount: number;
        message: string;
        mockMode?: undefined;
        successCount?: undefined;
        failureCount?: undefined;
        responses?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        tokensCount: number;
        successCount: any;
        failureCount: any;
        responses: any;
        mockMode?: undefined;
        message?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        mockMode?: undefined;
        message?: undefined;
        tokensCount?: undefined;
        successCount?: undefined;
        failureCount?: undefined;
        responses?: undefined;
    }>;
}
