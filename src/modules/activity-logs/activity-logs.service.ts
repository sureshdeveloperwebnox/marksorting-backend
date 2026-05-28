import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateActivityLogDto } from './dto/create-activity-log.dto';
import { QueryActivityLogsDto } from './dto/query-activity-logs.dto';
import { Prisma } from '@prisma/client';
import * as XLSX from 'xlsx';

@Injectable()
export class ActivityLogsService {
  private readonly logger = new Logger(ActivityLogsService.name);

  constructor(private prisma: PrismaService) {}

  async create(dto: CreateActivityLogDto) {
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
    } catch (error) {
      this.logger.error(`Failed to create activity log: ${error.message}`, error.stack);
      // Don't throw - logging should not break the main flow
      return null;
    }
  }

  async findAll(dto: QueryActivityLogsDto) {
    const { skip, take, user_id, action, entity_type, entity_id, start_date, end_date, search } = dto;

    const where: Prisma.ActivityLogWhereInput = {};

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

  async getUserActivity(userId: string, limit: number = 100) {
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

  async getEntityActivity(entityType: string, entityId: string, limit: number = 100) {
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

  async getStats(startDate?: Date, endDate?: Date) {
    const dateFilter: Prisma.ActivityLogWhereInput = {};
    if (startDate || endDate) {
      dateFilter.created_at = {};
      if (startDate) dateFilter.created_at.gte = startDate;
      if (endDate) dateFilter.created_at.lte = endDate;
    }

    const [
      totalActivities,
      mostActiveUser,
      mostCommonAction,
      loginLogoutStats,
    ] = await Promise.all([
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

    // Get user details for most active user
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

    // Calculate login/logout counts
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

  async cleanup(olderThanDays: number = 90) {
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

  async exportToExcel(dto: QueryActivityLogsDto): Promise<Buffer> {
    // Fetch all logs matching the filters (no pagination for export)
    const { skip, take, ...filterDto } = dto;
    const allLogs = await this.findAll({ ...filterDto, skip: 0, take: 10000 }); // Max 10k records

    // Prepare data for Excel
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

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    const colWidths = [
      { wch: 8 },   // Sr. No.
      { wch: 22 },  // Date & Time
      { wch: 25 },  // User Name
      { wch: 30 },  // User Email
      { wch: 36 },  // User ID
      { wch: 12 },  // Action
      { wch: 20 },  // Entity Type
      { wch: 36 },  // Entity ID
      { wch: 50 },  // Description
      { wch: 15 },  // IP Address
      { wch: 40 },  // User Agent
      { wch: 20 },  // Device Name
      { wch: 50 },  // Metadata
    ];
    ws['!cols'] = colWidths;

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Activity Logs');

    // Generate filename with date
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const filename = `activity_logs_${dateStr}.xlsx`;

    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    this.logger.log(`Exported ${exportData.length} activity logs to Excel`);

    return buffer as Buffer;
  }
}
