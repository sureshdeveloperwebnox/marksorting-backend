import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { LogQueueService } from './log-queue.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

export enum SecurityEventType {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  ACCESS_DENIED = 'ACCESS_DENIED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PASSWORD_RESET = 'PASSWORD_RESET',
  MFA_ENABLED = 'MFA_ENABLED',
  MFA_DISABLED = 'MFA_DISABLED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED = 'ACCOUNT_UNLOCKED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  BRUTE_FORCE_ATTEMPT = 'BRUTE_FORCE_ATTEMPT',
  SESSION_HIJACKING = 'SESSION_HIJACKING',
  DATA_EXPORT = 'DATA_EXPORT',
  ADMIN_ACTION = 'ADMIN_ACTION',
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
  geolocation?: { country: string; city: string; lat: number; lng: number };
  correlationId?: string;
  sessionId?: string;
  riskScore?: number;
  isSuspicious?: boolean;
}

@Injectable()
export class SecurityLogService {
  private readonly logger = new Logger(SecurityLogService.name);

  constructor(
    private prisma: PrismaService,
    private logQueue: LogQueueService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(options: CreateSecurityLogOptions): Promise<void> {
    try {
      const isSuspicious = options.isSuspicious || await this.detectSuspiciousActivity(options);
      
      if (isSuspicious) {
        this.eventEmitter.emit('security.alert', {
          type: 'SUSPICIOUS_ACTIVITY',
          data: options,
        });
      }

      const logData = {
        userId: options.userId,
        eventType: options.eventType,
        severity: options.severity,
        description: options.description,
        emailAttempted: options.emailAttempted,
        authMethod: options.authMethod,
        mfaUsed: options.mfaUsed,
        failureReason: options.failureReason,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        deviceFingerprint: options.deviceFingerprint,
        geolocation: options.geolocation,
        correlationId: options.correlationId,
        sessionId: options.sessionId,
        riskScore: options.riskScore || this.calculateRiskScore(options),
        isSuspicious,
      };

      await this.logQueue.addSecurityLog(logData, { priority: 10 });

      if (options.severity === 'CRITICAL') {
        this.eventEmitter.emit('security.critical', logData);
      }

    } catch (error) {
      this.logger.error(`Failed to create security log: ${(error as Error).message}`, (error as Error).stack);
    }
  }

  async detectSuspiciousActivity(options: CreateSecurityLogOptions): Promise<boolean> {
    if (options.eventType === SecurityEventType.LOGIN_FAILED) {
      const recentFailures = await this.prisma.securityLog.count({
        where: {
          ip_address: options.ipAddress,
          event_type: SecurityEventType.LOGIN_FAILED,
          created_at: {
            gte: new Date(Date.now() - 15 * 60 * 1000),
          },
        },
      });

      if (recentFailures >= 5) {
        return true;
      }
    }

    if (options.eventType === SecurityEventType.LOGIN && options.userId) {
      const lastLogin = await this.prisma.securityLog.findFirst({
        where: {
          user_id: options.userId,
          event_type: SecurityEventType.LOGIN,
        },
        orderBy: { created_at: 'desc' },
        skip: 1,
      });

      if (lastLogin && lastLogin.geolocation && options.geolocation) {
        const timeDiff = Date.now() - lastLogin.created_at.getTime();
        const distance = this.calculateDistance(
          lastLogin.geolocation as any,
          options.geolocation,
        );
        
        if (distance > 500 && timeDiff < 2 * 60 * 60 * 1000) {
          return true;
        }
      }
    }

    return false;
  }

  private calculateRiskScore(options: CreateSecurityLogOptions): number {
    let score = 0;

    if (options.eventType === SecurityEventType.LOGIN_FAILED) score += 30;
    if (!options.userId) score += 20;
    if (options.isSuspicious) score += 40;
    if (options.severity === 'CRITICAL') score += 50;
    if (options.severity === 'ERROR') score += 30;

    return Math.min(score, 100);
  }

  private calculateDistance(loc1: { lat: number; lng: number }, loc2: { lat: number; lng: number }): number {
    const R = 6371;
    const dLat = this.deg2rad(loc2.lat - loc1.lat);
    const dLon = this.deg2rad(loc2.lng - loc1.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(loc1.lat)) * Math.cos(this.deg2rad(loc2.lat)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  async getFailedLoginAttempts(email: string, minutes: number = 15): Promise<number> {
    return this.prisma.securityLog.count({
      where: {
        email_attempted: email,
        event_type: SecurityEventType.LOGIN_FAILED,
        created_at: {
          gte: new Date(Date.now() - minutes * 60 * 1000),
        },
      },
    });
  }

  async getSuspiciousActivities(limit: number = 100) {
    return this.prisma.securityLog.findMany({
      where: { is_suspicious: true },
      orderBy: { created_at: 'desc' },
      take: limit,
      include: {
        user: {
          select: { id: true, full_name: true, email: true },
        },
      },
    });
  }

  async getSecurityStats(startDate?: Date, endDate?: Date) {
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.created_at = {};
      if (startDate) dateFilter.created_at.gte = startDate;
      if (endDate) dateFilter.created_at.lte = endDate;
    }

    const [
      totalEvents,
      bySeverity,
      byType,
      suspiciousCount,
    ] = await Promise.all([
      this.prisma.securityLog.count({ where: dateFilter }),
      this.prisma.securityLog.groupBy({
        by: ['severity'],
        where: dateFilter,
        _count: { id: true },
      }),
      this.prisma.securityLog.groupBy({
        by: ['event_type'],
        where: dateFilter,
        _count: { id: true },
      }),
      this.prisma.securityLog.count({
        where: { ...dateFilter, is_suspicious: true },
      }),
    ]);

    return {
      total_events: totalEvents,
      by_severity: bySeverity,
      by_type: byType,
      suspicious_count: suspiciousCount,
    };
  }
}
