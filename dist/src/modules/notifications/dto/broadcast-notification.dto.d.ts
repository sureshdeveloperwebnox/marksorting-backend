export declare enum NotificationType {
    SERVICE_REPORT = "SERVICE_REPORT",
    INSTALLATION = "INSTALLATION",
    EXPENSE = "EXPENSE",
    TICKET = "TICKET",
    BROADCAST = "BROADCAST"
}
export declare enum NotificationTarget {
    ALL = "ALL",
    ROLE = "ROLE",
    USERS = "USERS"
}
export declare class BroadcastNotificationDto {
    title: string;
    message: string;
    type?: NotificationType;
    target?: NotificationTarget;
    role_name?: string;
    user_ids?: string[];
    meta_data?: Record<string, any>;
}
