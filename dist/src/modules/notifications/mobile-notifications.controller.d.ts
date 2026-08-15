import { NotificationsService } from './notifications.service';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
export declare class MobileNotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    registerPushToken(req: any, dto: RegisterPushTokenDto): Promise<any>;
    getNotifications(req: any, skip?: string, take?: string): Promise<{
        notifications: any;
        total: any;
        unreadCount: any;
    }>;
    markAllAsRead(req: any): Promise<any>;
    markAsRead(req: any, id: string): Promise<any>;
}
