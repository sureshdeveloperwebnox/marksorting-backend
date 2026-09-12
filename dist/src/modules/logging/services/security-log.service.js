"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SecurityLogService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityLogService = exports.SecurityEventType = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const log_queue_service_1 = require("./log-queue.service");
const event_emitter_1 = require("@nestjs/event-emitter");
var SecurityEventType;
(function (SecurityEventType) {
    SecurityEventType["LOGIN"] = "LOGIN";
    SecurityEventType["LOGOUT"] = "LOGOUT";
    SecurityEventType["LOGIN_FAILED"] = "LOGIN_FAILED";
    SecurityEventType["ACCESS_DENIED"] = "ACCESS_DENIED";
    SecurityEventType["PERMISSION_DENIED"] = "PERMISSION_DENIED";
    SecurityEventType["PASSWORD_CHANGE"] = "PASSWORD_CHANGE";
    SecurityEventType["PASSWORD_RESET"] = "PASSWORD_RESET";
    SecurityEventType["MFA_ENABLED"] = "MFA_ENABLED";
    SecurityEventType["MFA_DISABLED"] = "MFA_DISABLED";
    SecurityEventType["ACCOUNT_LOCKED"] = "ACCOUNT_LOCKED";
    SecurityEventType["ACCOUNT_UNLOCKED"] = "ACCOUNT_UNLOCKED";
    SecurityEventType["SUSPICIOUS_ACTIVITY"] = "SUSPICIOUS_ACTIVITY";
    SecurityEventType["BRUTE_FORCE_ATTEMPT"] = "BRUTE_FORCE_ATTEMPT";
    SecurityEventType["SESSION_HIJACKING"] = "SESSION_HIJACKING";
    SecurityEventType["DATA_EXPORT"] = "DATA_EXPORT";
    SecurityEventType["ADMIN_ACTION"] = "ADMIN_ACTION";
})(SecurityEventType || (exports.SecurityEventType = SecurityEventType = {}));
let SecurityLogService = SecurityLogService_1 = class SecurityLogService {
    prisma;
    logQueue;
    eventEmitter;
    logger = new common_1.Logger(SecurityLogService_1.name);
    constructor(prisma, logQueue, eventEmitter) {
        this.prisma = prisma;
        this.logQueue = logQueue;
        this.eventEmitter = eventEmitter;
    }
    async create(options) {
        try {
            const isSuspicious = options.isSuspicious || (await this.detectSuspiciousActivity(options));
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
        }
        catch (error) {
            this.logger.error(`Failed to create security log: ${error.message}`, error.stack);
        }
    }
    async detectSuspiciousActivity(options) {
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
                const distance = this.calculateDistance(lastLogin.geolocation, options.geolocation);
                if (distance > 500 && timeDiff < 2 * 60 * 60 * 1000) {
                    return true;
                }
            }
        }
        return false;
    }
    calculateRiskScore(options) {
        let score = 0;
        if (options.eventType === SecurityEventType.LOGIN_FAILED)
            score += 30;
        if (!options.userId)
            score += 20;
        if (options.isSuspicious)
            score += 40;
        if (options.severity === 'CRITICAL')
            score += 50;
        if (options.severity === 'ERROR')
            score += 30;
        return Math.min(score, 100);
    }
    calculateDistance(loc1, loc2) {
        const R = 6371;
        const dLat = this.deg2rad(loc2.lat - loc1.lat);
        const dLon = this.deg2rad(loc2.lng - loc1.lng);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(loc1.lat)) *
                Math.cos(this.deg2rad(loc2.lat)) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    deg2rad(deg) {
        return deg * (Math.PI / 180);
    }
    async getFailedLoginAttempts(email, minutes = 15) {
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
    async getSuspiciousActivities(limit = 100) {
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
    async getSecurityStats(startDate, endDate) {
        const dateFilter = {};
        if (startDate || endDate) {
            dateFilter.created_at = {};
            if (startDate)
                dateFilter.created_at.gte = startDate;
            if (endDate)
                dateFilter.created_at.lte = endDate;
        }
        const [totalEvents, bySeverity, byType, suspiciousCount] = await Promise.all([
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
};
exports.SecurityLogService = SecurityLogService;
exports.SecurityLogService = SecurityLogService = SecurityLogService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        log_queue_service_1.LogQueueService,
        event_emitter_1.EventEmitter2])
], SecurityLogService);
//# sourceMappingURL=security-log.service.js.map