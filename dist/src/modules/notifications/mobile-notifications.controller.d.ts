import { NotificationsService } from './notifications.service';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
export declare class MobileNotificationsController {
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
            created_at: Date;
            type: string;
            title: string;
            status: string;
            message: string;
            meta_data: import("@prisma/client/runtime/client").JsonValue | null;
            user_id: string | null;
        }[];
        total: number;
        unreadCount: number;
    }>;
    markAllAsRead(req: any): Promise<import("@prisma/client").Prisma.BatchPayload>;
    markAsRead(req: any, id: string): Promise<{
        id: string;
        created_at: Date;
        type: string;
        title: string;
        status: string;
        message: string;
        meta_data: import("@prisma/client/runtime/client").JsonValue | null;
        user_id: string | null;
    }>;
}
