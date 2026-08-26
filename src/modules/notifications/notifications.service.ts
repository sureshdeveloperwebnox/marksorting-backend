import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationType } from './dto/broadcast-notification.dto';
import { DeviceType } from './dto/register-push-token.dto';

import { NotificationProcessor } from './notification.processor';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue('notifications') private notificationsQueue: Queue,
    private gateway: NotificationsGateway,
    private notificationProcessor: NotificationProcessor,
  ) {}

  /**
   * Resolves an ID (which could be a User ID or a Technician ID) to a valid User ID.
   * If the ID directly matches an active User, returns it.
   * If not, attempts to find a matching Technician record and resolve to the User
   * via matching ID, email, or phone number.
   */
  async resolveToUserId(idOrTechId: string): Promise<string | null> {
    if (!idOrTechId) return null;

    // 1. Direct check in User table
    const directUser = await this.prisma.user.findFirst({
      where: {
        id: idOrTechId,
        account_status: 'ACTIVE',
        deleted_at: null,
      },
      select: { id: true },
    });
    if (directUser) {
      return directUser.id;
    }

    // 2. Lookup Technician table
    const technician = await this.prisma.technician.findFirst({
      where: {
        id: idOrTechId,
        deleted_at: null,
      },
      select: { id: true, email: true, phone: true },
    });

    if (technician) {
      // Find matching user by email or phone
      const matchedUser = await this.prisma.user.findFirst({
        where: {
          account_status: 'ACTIVE',
          deleted_at: null,
          OR: [
            { id: technician.id },
            ...(technician.email ? [{ email: technician.email }] : []),
            ...(technician.phone ? [{ phone_number: technician.phone }] : []),
          ],
        },
        select: { id: true },
      });

      if (matchedUser) {
        return matchedUser.id;
      }
    }

    return null;
  }

  /**
   * Batch resolves an array of IDs (user IDs or technician IDs) to unique, active User IDs.
   */
  async resolveUserIds(ids: string[]): Promise<string[]> {
    const rawIds = Array.from(new Set((ids || []).filter(Boolean)));
    if (!rawIds.length) return [];

    const resolved = await Promise.all(
      rawIds.map((id) => this.resolveToUserId(id)),
    );
    return Array.from(new Set(resolved.filter((id): id is string => Boolean(id))));
  }

  async createNotification(
    userIdOrTechId: string,
    title: string,
    message: string,
    type: NotificationType,
    metaData?: Record<string, any>,
  ) {
    if (!userIdOrTechId) return null;

    const resolvedUserId = await this.resolveToUserId(userIdOrTechId);
    if (!resolvedUserId) {
      this.logger.warn(
        `Cannot create notification: Target ID ${userIdOrTechId} could not be resolved to an active user.`,
      );
      return null;
    }

    const notification = await this.prisma.notification.create({
      data: {
        user_id: resolvedUserId,
        title,
        message,
        type,
        status: 'UNREAD',
        meta_data: metaData ?? undefined,
      },
    });

    this.gateway.emitToUser(resolvedUserId, 'notification', notification);

    const recordId =
      metaData?.storeId ||
      metaData?.reportId ||
      metaData?.expenseId ||
      metaData?.ticketId ||
      metaData?.id ||
      notification.id;

    const pushPayload = {
      id: notification.id,
      recordId,
      userId: resolvedUserId,
      title,
      message,
      type,
      metaData,
    };

    // Execute direct push immediately with zero delay
    this.notificationProcessor.sendPush(pushPayload).catch(async (pushErr) => {
      this.logger.warn(
        `Immediate FCM push error for user ${resolvedUserId}, queuing to BullMQ: ${pushErr?.message}`,
      );
      try {
        await this.notificationsQueue.add('send-push', pushPayload, {
          jobId: `push_${notification.id}_${resolvedUserId}`,
          removeOnComplete: true,
          removeOnFail: false,
          attempts: 2,
          backoff: { type: 'exponential', delay: 5000 },
        });
      } catch (qErr) {
        this.logger.error(`Failed to enqueue push notification job`, qErr);
      }
    });

    return notification;
  }

  async sendToUsers(
    userIds: string[],
    title: string,
    message: string,
    type: NotificationType,
    metaData?: Record<string, any>,
  ) {
    const validUserIds = await this.resolveUserIds(userIds);
    await Promise.all(
      validUserIds.map((uid) =>
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
        role: {
          name: {
            in: roleNames,
            mode: 'insensitive',
          },
        },
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
        role: {
          name: {
            in: [
              'SUPER_ADMIN',
              'Super Admin',
              'super admin',
              'Admin',
              'admin',
              'Manager',
              'manager',
            ],
            mode: 'insensitive',
          },
        },
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
    const resolvedTechUserIds = await this.resolveUserIds(technicianUserIds || []);
    const resolvedCreatorId = creatorUserId
      ? await this.resolveToUserId(creatorUserId)
      : undefined;

    const recipientIds = new Set([...adminIds, ...resolvedTechUserIds]);
    if (resolvedCreatorId) {
      recipientIds.delete(resolvedCreatorId);
    }
    // If only the creator was the recipient, keep creator so an action notification is logged
    if (recipientIds.size === 0 && resolvedCreatorId) {
      recipientIds.add(resolvedCreatorId);
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

  async testPushDelivery(targetUserIdOrEmail?: string) {
    let targetUserId = targetUserIdOrEmail;
    if (targetUserIdOrEmail && targetUserIdOrEmail.includes('@')) {
      const u = await this.prisma.user.findFirst({
        where: { email: { equals: targetUserIdOrEmail, mode: 'insensitive' } },
        select: { id: true },
      });
      if (u) targetUserId = u.id;
    }

    if (!targetUserId) {
      // Find the most recently active push token user
      const latestToken = await this.prisma.pushToken.findFirst({
        orderBy: { updated_at: 'desc' },
        select: { user_id: true, user: { select: { email: true, full_name: true } } },
      });
      if (latestToken) targetUserId = latestToken.user_id;
    }

    if (!targetUserId) {
      return {
        success: false,
        message: 'No users with registered FCM push tokens found in database.',
      };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, email: true, full_name: true },
    });

    const tokens = await this.prisma.pushToken.findMany({
      where: { user_id: targetUserId },
      select: { token: true, device_type: true, updated_at: true },
    });

    const pushResult = await this.notificationProcessor.sendPush({
      userId: targetUserId,
      title: '🧪 FCM Test Push Notification',
      message: `Test delivered successfully at ${new Date().toLocaleTimeString()}`,
      type: 'BROADCAST',
      metaData: { isTest: true, timestamp: Date.now() },
    });

    return {
      success: pushResult?.success ?? false,
      targetUser: user,
      registeredTokens: tokens,
      fcmResult: pushResult,
    };
  }
}

