import { SetMetadata } from '@nestjs/common';
import { ActivityAction } from '../enums/activity-action.enum';

export const LOG_ACTIVITY_KEY = 'log_activity';

export interface LogActivityOptions {
  action: ActivityAction | string;
  entityType: string;
  entityIdParam?: string; // Parameter name containing the entity ID
  description: string | ((context: LogActivityContext) => string | Promise<string>);
  ignoreNullEntity?: boolean; // Don't log if entity is null/undefined
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

export const LogActivity = (options: LogActivityOptions) =>
  SetMetadata(LOG_ACTIVITY_KEY, options);
