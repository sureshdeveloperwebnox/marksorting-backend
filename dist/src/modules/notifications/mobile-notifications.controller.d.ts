import { NotificationsService } from './notifications.service';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
export declare class MobileNotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    registerPushToken(req: any, dto: RegisterPushTokenDto): Promise<{
        id: string;
        user_id: string;
        created_at: Date;
        updated_at: Date;
        token: string;
        device_type: string;
    } | null>;
    testMyDevice(req: any): Promise<{
        success: boolean;
        message: string;
        targetUser?: undefined;
        registeredTokens?: undefined;
        fcmResult?: undefined;
    } | {
        success: boolean;
        targetUser: {
            id: string;
            full_name: string;
            email: string;
        } | null;
        registeredTokens: {
            updated_at: Date;
            token: string;
            device_type: string;
        }[];
        fcmResult: {
            success: boolean;
            mockMode: boolean;
            message: string;
            tokensCount?: undefined;
            successCount?: undefined;
            failureCount?: undefined;
            responses?: undefined;
            error?: undefined;
        } | {
            success: boolean;
            tokensCount: number;
            message: string;
            mockMode?: undefined;
            successCount?: undefined;
            failureCount?: undefined;
            responses?: undefined;
            error?: undefined;
        } | {
            success: boolean;
            tokensCount: number;
            successCount: any;
            failureCount: any;
            responses: any;
            mockMode?: undefined;
            message?: undefined;
            error?: undefined;
        } | {
            success: boolean;
            error: any;
            mockMode?: undefined;
            message?: undefined;
            tokensCount?: undefined;
            successCount?: undefined;
            failureCount?: undefined;
            responses?: undefined;
        };
        message?: undefined;
    }>;
    deregisterPushToken(req: any, token: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
    getNotifications(req: any, skip?: string, take?: string, type?: string, types?: string, startDate?: string, endDate?: string): Promise<{
        notifications: {
            id: string;
            user_id: string | null;
            created_at: Date;
            status: string;
            type: string;
            title: string;
            message: string;
            meta_data: import("@prisma/client/runtime/client").JsonValue | null;
        }[];
        total: number;
        unreadCount: number;
    }>;
    markAllAsRead(req: any): Promise<import("@prisma/client").Prisma.BatchPayload>;
    markAsRead(req: any, id: string): Promise<{
        id: string;
        user_id: string | null;
        created_at: Date;
        status: string;
        type: string;
        title: string;
        message: string;
        meta_data: import("@prisma/client/runtime/client").JsonValue | null;
    }>;
}
