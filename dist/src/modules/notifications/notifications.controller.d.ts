import { NotificationsService } from './notifications.service';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
import { BroadcastNotificationDto } from './dto/broadcast-notification.dto';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    registerPushToken(req: any, dto: RegisterPushTokenDto): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        user_id: string;
        token: string;
        device_type: string;
    }>;
    getNotifications(req: any, skip?: string, take?: string): Promise<{
        notifications: {
            id: string;
            status: string;
            created_at: Date;
            user_id: string | null;
            type: string;
            title: string;
            message: string;
            meta_data: import("@prisma/client/runtime/client").JsonValue | null;
        }[];
        total: number;
        unreadCount: number;
    }>;
    markAsRead(req: any, id: string): Promise<{
        id: string;
        status: string;
        created_at: Date;
        user_id: string | null;
        type: string;
        title: string;
        message: string;
        meta_data: import("@prisma/client/runtime/client").JsonValue | null;
    }>;
    markAllAsRead(req: any): Promise<import("@prisma/client").Prisma.BatchPayload>;
    broadcast(dto: BroadcastNotificationDto): Promise<{
        message: string;
    }>;
}
