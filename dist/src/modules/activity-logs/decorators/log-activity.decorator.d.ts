import { ActivityAction } from '../enums/activity-action.enum';
export declare const LOG_ACTIVITY_KEY = "log_activity";
export interface LogActivityOptions {
    action: ActivityAction | string;
    entityType: string;
    entityIdParam?: string;
    description: string | ((context: LogActivityContext) => string | Promise<string>);
    ignoreNullEntity?: boolean;
}
export interface LogActivityContext {
    user: {
        id: string;
        email: string;
        full_name: string;
    };
    body: any;
    params: any;
    query: any;
    result: any;
    ip_address?: string;
    user_agent?: string;
    device_name?: string;
}
export declare const LogActivity: (options: LogActivityOptions) => import("@nestjs/common").CustomDecorator<string>;
