import { NotificationsService } from './notifications.service';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
export declare class MobileNotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    registerPushToken(req: any, dto: RegisterPushTokenDto): Promise<{
        id: string;
        user_id: string;
        token: string;
        device_type: string;
        created_at: Date;
        updated_at: Date;
    } | null>;
    deregisterPushToken(req: any, token: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
    getNotifications(req: any, skip?: string, take?: string, type?: string, types?: string, startDate?: string, endDate?: string): Promise<{
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
    markAllAsRead(req: any): Promise<import("@prisma/client").Prisma.BatchPayload>;
    markAsRead(req: any, id: string): Promise<{
        id: string;
        title: string;
        message: string;
        type: string;
        user_id: string | null;
        created_at: Date;
        status: string;
        meta_data: import("@prisma/client/runtime/client").JsonValue | null;
    }>;
}
