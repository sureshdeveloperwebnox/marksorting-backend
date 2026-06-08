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
    getSuspiciousActivities(limit?: number): Promise<({
        user: {
            id: string;
            full_name: string;
            email: string;
        } | null;
    } & {
        id: string;
        user_id: string | null;
        description: string;
        ip_address: string;
        user_agent: string | null;
        correlation_id: string | null;
        session_id: string | null;
        created_at: Date;
        event_type: string;
        severity: string;
        email_attempted: string | null;
        auth_method: string | null;
        mfa_used: boolean;
        failure_reason: string | null;
        device_fingerprint: string | null;
        geolocation: import("@prisma/client/runtime/client").JsonValue | null;
        risk_score: number | null;
        is_suspicious: boolean;
    })[]>;
    getSecurityStats(startDate?: Date, endDate?: Date): Promise<{
        total_events: number;
        by_severity: (import("@prisma/client").Prisma.PickEnumerable<import("@prisma/client").Prisma.SecurityLogGroupByOutputType, "severity"[]> & {
            _count: {
                id: number;
            };
        })[];
        by_type: (import("@prisma/client").Prisma.PickEnumerable<import("@prisma/client").Prisma.SecurityLogGroupByOutputType, "event_type"[]> & {
            _count: {
                id: number;
            };
        })[];
        suspicious_count: number;
    }>;
}
