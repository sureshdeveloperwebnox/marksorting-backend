import { Queue } from 'bullmq';
export declare enum LogQueue {
    ACTIVITY = "activity-logs",
    AUDIT = "audit-logs",
    SECURITY = "security-logs",
    API = "api-logs",
    ERROR = "error-logs",
    JOB = "job-logs",
    NOTIFICATION = "notification-logs"
}
export interface LogJobOptions {
    priority?: number;
    delay?: number;
    attempts?: number;
}
export declare class LogQueueService {
    private activityQueue;
    private auditQueue;
    private securityQueue;
    private apiQueue;
    private errorQueue;
    private readonly logger;
    constructor(activityQueue: Queue, auditQueue: Queue, securityQueue: Queue, apiQueue: Queue, errorQueue: Queue);
    addActivityLog(data: any, options?: LogJobOptions): Promise<import("bullmq").Job<any, any, string>>;
    addAuditTrail(data: any, options?: LogJobOptions): Promise<import("bullmq").Job<any, any, string>>;
    addSecurityLog(data: any, options?: LogJobOptions): Promise<import("bullmq").Job<any, any, string>>;
    addApiLog(data: any, options?: LogJobOptions): Promise<import("bullmq").Job<any, any, string>>;
    addErrorLog(data: any, options?: LogJobOptions): Promise<import("bullmq").Job<any, any, string>>;
    addBulkActivityLogs(logs: any[]): Promise<import("bullmq").Job<any, any, string>[]>;
    getQueueMetrics(): Promise<{
        activity: {
            waiting: number;
            active: number;
            completed: number;
            failed: number;
        };
        audit: {
            waiting: number;
            active: number;
            completed: number;
            failed: number;
        };
        security: {
            waiting: number;
            active: number;
            completed: number;
            failed: number;
        };
    }>;
}
