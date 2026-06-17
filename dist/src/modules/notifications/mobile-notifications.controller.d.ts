import { NotificationsService } from './notifications.service';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
export declare class MobileNotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    registerPushToken(req: any, dto: RegisterPushTokenDto): Promise<{
        id: string;
        created_at: Date;
        user_id: string;
        updated_at: Date;
        token: string;
        device_type: string;
    }>;
    getNotifications(req: any, skip?: string, take?: string): Promise<{
        notifications: {
            type: string;
            id: string;
            created_at: Date;
            user_id: string | null;
            message: string;
            title: string;
            status: string;
            meta_data: import("@prisma/client/runtime/client").JsonValue | null;
        }[];
        total: number;
        unreadCount: number;
    }>;
    markAllAsRead(req: any): Promise<import("@prisma/client").Prisma.BatchPayload>;
    markAsRead(req: any, id: string): Promise<{
        type: string;
        id: string;
        created_at: Date;
        user_id: string | null;
        message: string;
        title: string;
        status: string;
        meta_data: import("@prisma/client/runtime/client").JsonValue | null;
    }>;
}
