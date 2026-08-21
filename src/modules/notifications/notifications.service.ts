import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationType } from './dto/broadcast-notification.dto';
import { DeviceType } from './dto/register-push-token.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue('notifications') private notificationsQueue: Queue,
    private gateway: NotificationsGateway,
  ) {}

  async createNotification(
    userId: string,
    title: string,
    message: string,
    type: NotificationType,
    metaData?: Record<string, any>,
  ) {
    if (!userId) return null;

    const userExists = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!userExists) {
      this.logger.warn(
        `Cannot create notification: User ${userId} does not exist in the database.`,
      );
      return null;
    }

    const notification = await this.prisma.notification.create({
      data: {
        user_id: userId,
        title,
        message,
        type,
        status: 'UNREAD',
        meta_data: metaData ?? undefined,
      },
    });

    this.gateway.emitToUser(userId, 'notification', notification);

    const recordId =
      metaData?.storeId ||
      metaData?.reportId ||
      metaData?.expenseId ||
      metaData?.ticketId ||
      metaData?.id ||
      notification.id;

    await this.notificationsQueue.add(
      'send-push',
      {
        id: notification.id,
        recordId,
        userId,
        title,
        message,
        type,
        metaData,
      },
      {
        jobId: `push_${notification.id}_${userId}`,
        removeOnComplete: true,
        removeOnFail: false,
        attempts: 2,
        backoff: { type: 'exponential', delay: 5000 },
      },
    );

    return notification;
  }

  async sendToUsers(
    userIds: string[],
    title: string,
    message: string,
    type: NotificationType,
    metaData?: Record<string, any>,
  ) {
    const uniqueUserIds = Array.from(new Set((userIds || []).filter(Boolean)));
    await Promise.all(
      uniqueUserIds.map((uid) =>
        this.createNotification(uid, title, message, type, metaData),
      ),
    );
  }

  async broadcast(
    title: string,
    message: string,
    type: NotificationType,
    metaData?: Record<string, any>,
  ) {
    const users = await this.prisma.user.findMany({
      where: { account_status: 'ACTIVE', deleted_at: null },
      select: { id: true },
    });
    await this.sendToUsers(
      users.map((u) => u.id),
      title,
      message,
      type,
      metaData,
    );
  }

  async broadcastToRole(
    roleName: string,
    title: string,
    message: string,
    type: NotificationType,
    metaData?: Record<string, any>,
  ) {
    await this.broadcastToRoles([roleName], title, message, type, metaData);
  }

  async broadcastToRoles(
    roleNames: string[],
    title: string,
    message: string,
    type: NotificationType,
    metaData?: Record<string, any>,
  ) {
    const users = await this.prisma.user.findMany({
      where: {
        account_status: 'ACTIVE',
        deleted_at: null,
        role: { name: { in: roleNames } },
      },
      select: { id: true },
    });
    await this.sendToUsers(
      users.map((u) => u.id),
      title,
      message,
      type,
      metaData,
    );
  }

  async getAdminUserIds(): Promise<string[]> {
    const admins = await this.prisma.user.findMany({
      where: {
        account_status: 'ACTIVE',
        deleted_at: null,
        role: { name: { in: ['SUPER_ADMIN', 'Admin', 'Super Admin'] } },
      },
      select: { id: true },
    });
    return admins.map((a) => a.id);
  }

  async getUserNotifications(
    userId: string,
    skip = 0,
    take = 20,
    options?: {
      type?: string;
      types?: string[];
      startDate?: string;
      endDate?: string;
    },
  ) {
    const where: any = { user_id: userId };

    if (options?.types && options.types.length > 0) {
      where.type = { in: options.types };
    } else if (options?.type && options.type !== 'ALL') {
      where.type = options.type;
    }

    if (options?.startDate || options?.endDate) {
      where.created_at = {};
      if (options.startDate) {
        const startStr = options.startDate.includes('T')
          ? options.startDate
          : `${options.startDate}T00:00:00.000Z`;
        where.created_at.gte = new Date(startStr);
      }
      if (options.endDate) {
        const endStr = options.endDate.includes('T')
          ? options.endDate
          : `${options.endDate}T23:59:59.999Z`;
        where.created_at.lte = new Date(endStr);
      }
    }

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: { ...where, status: 'UNREAD' },
      }),
    ]);
    return { notifications, total, unreadCount };
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, user_id: userId },
    });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { status: 'READ' },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { user_id: userId, status: 'UNREAD' },
      data: { status: 'READ' },
    });
  }

  async notifyStakeholders(
    technicianUserIds: string[],
    creatorUserId: string | undefined,
    title: string,
    message: string,
    type: NotificationType,
    metaData?: Record<string, any>,
  ) {
    const adminIds = await this.getAdminUserIds();
    const validTechIds = (technicianUserIds || []).filter(Boolean);
    const recipientIds = new Set([...adminIds, ...validTechIds]);
    if (creatorUserId) {
      recipientIds.delete(creatorUserId);
    }
    // If only the creator was the recipient, keep creator so an action notification is logged
    if (recipientIds.size === 0 && creatorUserId) {
      recipientIds.add(creatorUserId);
    }
    await this.sendToUsers(
      Array.from(recipientIds),
      title,
      message,
      type,
      metaData,
    );
  }

  async registerPushToken(
    userId: string,
    token: string,
    deviceType: DeviceType,
  ) {
    const cleanToken = token?.trim();
    if (!cleanToken || !userId) return null;

    // 1. A physical device token must belong to only ONE active user at a time.
    // Delete this token from any other accounts (e.g. previous user who logged in on this phone).
    await this.prisma.pushToken.deleteMany({
      where: {
        token: cleanToken,
        user_id: { not: userId },
      },
    });

    // 2. Keep only 1 active mobile token per user for this deviceType to prevent stale token accumulation
    if (deviceType !== DeviceType.WEB) {
      await this.prisma.pushToken.deleteMany({
        where: {
          user_id: userId,
          device_type: deviceType,
          token: { not: cleanToken },
        },
      });
    }

    // 3. Upsert the token for the current user
    return this.prisma.pushToken.upsert({
      where: { user_id_token: { user_id: userId, token: cleanToken } },
      create: { user_id: userId, token: cleanToken, device_type: deviceType },
      update: { device_type: deviceType, updated_at: new Date() },
    });
  }

  async removePushToken(userId: string, token: string) {
    return this.prisma.pushToken.deleteMany({
      where: { user_id: userId, token },
    });
  }
}
