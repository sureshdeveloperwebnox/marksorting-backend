import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export enum NotificationType {
  SERVICE_REPORT = 'SERVICE_REPORT',
  INSTALLATION = 'INSTALLATION',
  EXPENSE = 'EXPENSE',
  TICKET = 'TICKET',
  BROADCAST = 'BROADCAST',
}

export enum NotificationTarget {
  ALL = 'ALL',
  ROLE = 'ROLE',
  USERS = 'USERS',
}

export class BroadcastNotificationDto {
  @ApiProperty({ description: 'Notification title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Notification message body' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({
    enum: NotificationType,
    default: NotificationType.BROADCAST,
  })
  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType = NotificationType.BROADCAST;

  @ApiPropertyOptional({
    enum: NotificationTarget,
    default: NotificationTarget.ALL,
    description: 'Who should receive this notification',
  })
  @IsEnum(NotificationTarget)
  @IsOptional()
  target?: NotificationTarget = NotificationTarget.ALL;

  @ApiPropertyOptional({
    description: 'Role name to target when target=ROLE (e.g. "Service Engineer")',
  })
  @IsString()
  @IsOptional()
  role_name?: string;

  @ApiPropertyOptional({
    description: 'Specific user IDs to target when target=USERS',
    type: [String],
  })
  @IsArray()
  @IsOptional()
  user_ids?: string[];

  @ApiPropertyOptional({ description: 'Optional extra metadata JSON' })
  @IsObject()
  @IsOptional()
  meta_data?: Record<string, any>;
}
