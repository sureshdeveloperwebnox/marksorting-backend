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
    createNotification(userId: string, title: string, message: string, type: NotificationType, metaData?: Record<string, any>): Promise<{
        id: string;
        user_id: string | null;
        created_at: Date;
        status: string;
        message: string;
        type: string;
        title: string;
        meta_data: import("@prisma/client/runtime/client").JsonValue | null;
    }>;
    sendToUsers(userIds: string[], title: string, message: string, type: NotificationType, metaData?: Record<string, any>): Promise<void>;
    broadcast(title: string, message: string, type: NotificationType, metaData?: Record<string, any>): Promise<void>;
    broadcastToRole(roleName: string, title: string, message: string, type: NotificationType, metaData?: Record<string, any>): Promise<void>;
    broadcastToRoles(roleNames: string[], title: string, message: string, type: NotificationType, metaData?: Record<string, any>): Promise<void>;
    getAdminUserIds(): Promise<string[]>;
    getUserNotifications(userId: string, skip?: number, take?: number): Promise<{
        notifications: {
            id: string;
            user_id: string | null;
            created_at: Date;
            status: string;
            message: string;
            type: string;
            title: string;
            meta_data: import("@prisma/client/runtime/client").JsonValue | null;
        }[];
        total: number;
        unreadCount: number;
    }>;
    markAsRead(userId: string, notificationId: string): Promise<{
        id: string;
        user_id: string | null;
        created_at: Date;
        status: string;
        message: string;
        type: string;
        title: string;
        meta_data: import("@prisma/client/runtime/client").JsonValue | null;
    }>;
    markAllAsRead(userId: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
    registerPushToken(userId: string, token: string, deviceType: DeviceType): Promise<{
        id: string;
        user_id: string;
        created_at: Date;
        updated_at: Date;
        token: string;
        device_type: string;
    }>;
}
