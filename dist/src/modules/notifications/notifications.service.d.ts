import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationType } from './dto/broadcast-notification.dto';
import { DeviceType } from './dto/register-push-token.dto';
import { NotificationProcessor } from './notification.processor';
export declare class NotificationsService {
    private prisma;
    private notificationsQueue;
    private gateway;
    private notificationProcessor;
    private readonly logger;
    constructor(prisma: PrismaService, notificationsQueue: Queue, gateway: NotificationsGateway, notificationProcessor: NotificationProcessor);
    resolveToUserId(idOrTechId: string): Promise<string | null>;
    resolveUserIds(ids: string[]): Promise<string[]>;
    createNotification(userIdOrTechId: string, title: string, message: string, type: NotificationType, metaData?: Record<string, any>): Promise<{
        id: string;
        title: string;
        message: string;
        type: string;
        user_id: string | null;
        created_at: Date;
        status: string;
        meta_data: import("@prisma/client/runtime/client").JsonValue | null;
    } | null>;
    sendToUsers(userIds: string[], title: string, message: string, type: NotificationType, metaData?: Record<string, any>): Promise<void>;
    broadcast(title: string, message: string, type: NotificationType, metaData?: Record<string, any>): Promise<void>;
    broadcastToRole(roleName: string, title: string, message: string, type: NotificationType, metaData?: Record<string, any>): Promise<void>;
    broadcastToRoles(roleNames: string[], title: string, message: string, type: NotificationType, metaData?: Record<string, any>): Promise<void>;
    getAdminUserIds(): Promise<string[]>;
    getUserNotifications(userId: string, skip?: number, take?: number, options?: {
        type?: string;
        types?: string[];
        startDate?: string;
        endDate?: string;
    }): Promise<{
        notifications: {
            id: string;
            title: string;
            message: string;
            type: string;
            user_id: string | null;
            created_at: Date;
            status: string;
            meta_data: import("@prisma/client/runtime/client").JsonValue | null;
        }[];
        total: number;
        unreadCount: number;
    }>;
    markAsRead(userId: string, notificationId: string): Promise<{
        id: string;
        title: string;
        message: string;
        type: string;
        user_id: string | null;
        created_at: Date;
        status: string;
        meta_data: import("@prisma/client/runtime/client").JsonValue | null;
    }>;
    markAllAsRead(userId: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
    notifyStakeholders(technicianUserIds: string[], creatorUserId: string | undefined, title: string, message: string, type: NotificationType, metaData?: Record<string, any>): Promise<void>;
    registerPushToken(userId: string, token: string, deviceType: DeviceType): Promise<{
        id: string;
        user_id: string;
        token: string;
        device_type: string;
        created_at: Date;
        updated_at: Date;
    } | null>;
    removePushToken(userId: string, token: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
}
