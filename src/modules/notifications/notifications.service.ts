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

    await this.notificationsQueue.add(
      'send-push',
      { userId, title, message, type, metaData },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
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
    await Promise.all(
      userIds.map((uid) => this.createNotification(uid, title, message, type, metaData)),
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
    const users = await this.prisma.user.findMany({
      where: {
        account_status: 'ACTIVE',
        deleted_at: null,
        role: { name: roleName },
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
  ) {
    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        skip,
        take,
      }),
      this.prisma.notification.count({ where: { user_id: userId } }),
      this.prisma.notification.count({ where: { user_id: userId, status: 'UNREAD' } }),
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

  async registerPushToken(userId: string, token: string, deviceType: DeviceType) {
    return this.prisma.pushToken.upsert({
      where: { user_id_token: { user_id: userId, token } },
      create: { user_id: userId, token, device_type: deviceType },
      update: { device_type: deviceType, updated_at: new Date() },
    });
  }
}
