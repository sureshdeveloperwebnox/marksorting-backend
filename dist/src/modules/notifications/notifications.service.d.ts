import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationType } from './dto/broadcast-notification.dto';
import { DeviceType } from './dto/register-push-token.dto';
export declare class NotificationsService {
    private prisma;
    private notificationsQueue;
    private gateway;
    private readonly logger;
    constructor(prisma: PrismaService, notificationsQueue: Queue, gateway: NotificationsGateway);
    createNotification(userId: string, title: string, message: string, type: NotificationType, metaData?: Record<string, any>): Promise<any>;
    sendToUsers(userIds: string[], title: string, message: string, type: NotificationType, metaData?: Record<string, any>): Promise<void>;
    broadcast(title: string, message: string, type: NotificationType, metaData?: Record<string, any>): Promise<void>;
    broadcastToRole(roleName: string, title: string, message: string, type: NotificationType, metaData?: Record<string, any>): Promise<void>;
    broadcastToRoles(roleNames: string[], title: string, message: string, type: NotificationType, metaData?: Record<string, any>): Promise<void>;
    getAdminUserIds(): Promise<string[]>;
    getUserNotifications(userId: string, skip?: number, take?: number): Promise<{
        notifications: any;
        total: any;
        unreadCount: any;
    }>;
    markAsRead(userId: string, notificationId: string): Promise<any>;
    markAllAsRead(userId: string): Promise<any>;
    notifyStakeholders(technicianUserIds: string[], creatorUserId: string | undefined, title: string, message: string, type: NotificationType, metaData?: Record<string, any>): Promise<void>;
    registerPushToken(userId: string, token: string, deviceType: DeviceType): Promise<any>;
}
