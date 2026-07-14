import { ActivityAction } from '../enums/activity-action.enum';
export declare class CreateActivityLogDto {
    user_id: string;
    action: ActivityAction | string;
    entity_type?: string;
    entity_id?: string;
    description: string;
    metadata?: Record<string, any>;
    ip_address?: string;
    user_agent?: string;
    device_name?: string;
}
