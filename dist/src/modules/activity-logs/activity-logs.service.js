"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ActivityLogsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityLogsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const XLSX = __importStar(require("xlsx"));
let ActivityLogsService = ActivityLogsService_1 = class ActivityLogsService {
    prisma;
    logger = new common_1.Logger(ActivityLogsService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        try {
            const log = await this.prisma.activityLog.create({
                data: {
                    user_id: dto.user_id,
                    action: dto.action,
                    entity_type: dto.entity_type,
                    entity_id: dto.entity_id,
                    description: dto.description,
                    metadata: dto.metadata ?? undefined,
                    ip_address: dto.ip_address,
                    user_agent: dto.user_agent,
                    device_name: dto.device_name,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            full_name: true,
                            email: true,
                        },
                    },
                },
            });
            this.logger.debug(`Activity logged: ${dto.action} - ${dto.description}`);
            return log;
        }
        catch (error) {
            this.logger.error(`Failed to create activity log: ${error.message}`, error.stack);
            return null;
        }
    }
    async findAll(dto) {
        const { skip, take, user_id, action, entity_type, entity_id, start_date, end_date, search } = dto;
        const where = {};
        if (user_id) {
            where.user_id = user_id;
        }
        if (action) {
            where.action = action;
        }
        if (entity_type) {
            where.entity_type = entity_type;
        }
        if (entity_id) {
            where.entity_id = entity_id;
        }
        if (start_date || end_date) {
            where.created_at = {};
            if (start_date) {
                where.created_at.gte = new Date(start_date);
            }
            if (end_date) {
                where.created_at.lte = new Date(end_date);
            }
        }
        if (search) {
            where.OR = [
                { description: { contains: search, mode: 'insensitive' } },
                { action: { contains: search, mode: 'insensitive' } },
                { entity_type: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [logs, total] = await Promise.all([
            this.prisma.activityLog.findMany({
                where,
                skip,
                take,
                orderBy: { created_at: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            full_name: true,
                            email: true,
                        },
                    },
                },
            }),
            this.prisma.activityLog.count({ where }),
        ]);
        return {
            data: logs,
            meta: {
                total,
                skip: skip || 0,
                take: take || 25,
                has_more: (skip || 0) + (take || 25) < total,
            },
        };
    }
    async getUserActivity(userId, limit = 100) {
        return this.prisma.activityLog.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' },
            take: limit,
            include: {
                user: {
                    select: {
                        id: true,
                        full_name: true,
                        email: true,
                    },
                },
            },
        });
    }
    async getEntityActivity(entityType, entityId, limit = 100) {
        return this.prisma.activityLog.findMany({
            where: {
                entity_type: entityType,
                entity_id: entityId,
            },
            orderBy: { created_at: 'desc' },
            take: limit,
            include: {
                user: {
                    select: {
                        id: true,
                        full_name: true,
                        email: true,
                    },
                },
            },
        });
    }
    async getStats(startDate, endDate) {
        const dateFilter = {};
        if (startDate || endDate) {
            dateFilter.created_at = {};
            if (startDate)
                dateFilter.created_at.gte = startDate;
            if (endDate)
                dateFilter.created_at.lte = endDate;
        }
        const [totalActivities, mostActiveUser, mostCommonAction, loginLogoutStats,] = await Promise.all([
            this.prisma.activityLog.count({ where: dateFilter }),
            this.prisma.activityLog.groupBy({
                by: ['user_id'],
                where: dateFilter,
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
                take: 1,
            }),
            this.prisma.activityLog.groupBy({
                by: ['action'],
                where: dateFilter,
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
                take: 1,
            }),
            this.prisma.activityLog.groupBy({
                by: ['action'],
                where: {
                    ...dateFilter,
                    action: { in: ['LOGIN', 'LOGOUT'] },
                },
                _count: { id: true },
            }),
        ]);
        let mostActiveUserDetails = null;
        if (mostActiveUser.length > 0) {
            const user = await this.prisma.user.findUnique({
                where: { id: mostActiveUser[0].user_id },
                select: { id: true, full_name: true, email: true },
            });
            if (user) {
                mostActiveUserDetails = {
                    ...user,
                    activity_count: mostActiveUser[0]._count.id,
                };
            }
        }
        const loginCount = loginLogoutStats.find(s => s.action === 'LOGIN')?._count.id || 0;
        const logoutCount = loginLogoutStats.find(s => s.action === 'LOGOUT')?._count.id || 0;
        return {
            total_activities: totalActivities,
            most_active_user: mostActiveUserDetails,
            most_common_action: mostCommonAction.length > 0
                ? { action: mostCommonAction[0].action, count: mostCommonAction[0]._count.id }
                : null,
            login_count: loginCount,
            logout_count: logoutCount,
        };
    }
    async cleanup(olderThanDays = 90) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
        const result = await this.prisma.activityLog.deleteMany({
            where: {
                created_at: {
                    lt: cutoffDate,
                },
            },
        });
        this.logger.log(`Cleaned up ${result.count} activity logs older than ${olderThanDays} days`);
        return { deleted_count: result.count };
    }
    async exportToExcel(dto) {
        const { skip, take, ...filterDto } = dto;
        const allLogs = await this.findAll({ ...filterDto, skip: 0, take: 10000 });
        const exportData = allLogs.data.map((log, index) => ({
            'Sr. No.': index + 1,
            'Date & Time': new Date(log.created_at).toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
            }),
            'User Name': log.user?.full_name || 'Unknown',
            'User Email': log.user?.email || '-',
            'User ID': log.user_id,
            'Action': log.action,
            'Entity Type': log.entity_type || '-',
            'Entity ID': log.entity_id || '-',
            'Description': log.description,
            'IP Address': log.ip_address || '-',
            'User Agent': log.user_agent || '-',
            'Device Name': log.device_name || '-',
            'Metadata': log.metadata ? JSON.stringify(log.metadata) : '-',
        }));
        const ws = XLSX.utils.json_to_sheet(exportData);
        const colWidths = [
            { wch: 8 },
            { wch: 22 },
            { wch: 25 },
            { wch: 30 },
            { wch: 36 },
            { wch: 12 },
            { wch: 20 },
            { wch: 36 },
            { wch: 50 },
            { wch: 15 },
            { wch: 40 },
            { wch: 20 },
            { wch: 50 },
        ];
        ws['!cols'] = colWidths;
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Activity Logs');
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const filename = `activity_logs_${dateStr}.xlsx`;
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        this.logger.log(`Exported ${exportData.length} activity logs to Excel`);
        return buffer;
    }
};
exports.ActivityLogsService = ActivityLogsService;
exports.ActivityLogsService = ActivityLogsService = ActivityLogsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ActivityLogsService);
//# sourceMappingURL=activity-logs.service.js.map