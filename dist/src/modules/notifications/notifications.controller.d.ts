import { NotificationsService } from './notifications.service';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
import { BroadcastNotificationDto } from './dto/broadcast-notification.dto';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    registerPushToken(req: any, dto: RegisterPushTokenDto): Promise<any>;
    getNotifications(req: any, skip?: string, take?: string): Promise<{
        notifications: any;
        total: any;
        unreadCount: any;
    }>;
    markAsRead(req: any, id: string): Promise<any>;
    markAllAsRead(req: any): Promise<any>;
    broadcast(dto: BroadcastNotificationDto): Promise<{
        message: string;
    }>;
}
