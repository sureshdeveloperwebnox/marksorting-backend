import { PrismaService } from '../../../prisma/prisma.service';
import { LogQueueService } from './log-queue.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
export declare enum SecurityEventType {
    LOGIN = "LOGIN",
    LOGOUT = "LOGOUT",
    LOGIN_FAILED = "LOGIN_FAILED",
    ACCESS_DENIED = "ACCESS_DENIED",
    PERMISSION_DENIED = "PERMISSION_DENIED",
    PASSWORD_CHANGE = "PASSWORD_CHANGE",
    PASSWORD_RESET = "PASSWORD_RESET",
    MFA_ENABLED = "MFA_ENABLED",
    MFA_DISABLED = "MFA_DISABLED",
    ACCOUNT_LOCKED = "ACCOUNT_LOCKED",
    ACCOUNT_UNLOCKED = "ACCOUNT_UNLOCKED",
    SUSPICIOUS_ACTIVITY = "SUSPICIOUS_ACTIVITY",
    BRUTE_FORCE_ATTEMPT = "BRUTE_FORCE_ATTEMPT",
    SESSION_HIJACKING = "SESSION_HIJACKING",
    DATA_EXPORT = "DATA_EXPORT",
    ADMIN_ACTION = "ADMIN_ACTION"
}
export interface CreateSecurityLogOptions {
    userId?: string;
    eventType: SecurityEventType;
    severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
    description: string;
    emailAttempted?: string;
    authMethod?: string;
    mfaUsed?: boolean;
    failureReason?: string;
    ipAddress: string;
    userAgent?: string;
    deviceFingerprint?: string;
    geolocation?: {
        country: string;
        city: string;
        lat: number;
        lng: number;
    };
    correlationId?: string;
    sessionId?: string;
    riskScore?: number;
    isSuspicious?: boolean;
}
export declare class SecurityLogService {
    private prisma;
    private logQueue;
    private eventEmitter;
    private readonly logger;
    constructor(prisma: PrismaService, logQueue: LogQueueService, eventEmitter: EventEmitter2);
    create(options: CreateSecurityLogOptions): Promise<void>;
    detectSuspiciousActivity(options: CreateSecurityLogOptions): Promise<boolean>;
    private calculateRiskScore;
    private calculateDistance;
    private deg2rad;
    getFailedLoginAttempts(email: string, minutes?: number): Promise<number>;
    getSuspiciousActivities(limit?: number): Promise<any>;
    getSecurityStats(startDate?: Date, endDate?: Date): Promise<{
        total_events: any;
        by_severity: any;
        by_type: any;
        suspicious_count: any;
    }>;
}
