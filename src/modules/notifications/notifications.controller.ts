import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
import {
  BroadcastNotificationDto,
  NotificationTarget,
} from './dto/broadcast-notification.dto';
import { LogActivity } from '../activity-logs/decorators/log-activity.decorator';
import { ActivityAction } from '../activity-logs/enums/activity-action.enum';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('push-token')
  @ApiOperation({ summary: 'Register an FCM push token for the current user' })
  registerPushToken(@Request() req: any, @Body() dto: RegisterPushTokenDto) {
    return this.notificationsService.registerPushToken(
      req.user.userId,
      dto.token,
      dto.device_type,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get paginated notifications for the current user' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  getNotifications(
    @Request() req: any,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.notificationsService.getUserNotifications(
      req.user.userId,
      skip ? parseInt(skip, 10) : 0,
      take ? parseInt(take, 10) : 20,
    );
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a specific notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  markAsRead(@Request() req: any, @Param('id') id: string) {
    return this.notificationsService.markAsRead(req.user.userId, id);
  }

  @Patch('read-all')
  @ApiOperation({
    summary: 'Mark all notifications as read for the current user',
  })
  markAllAsRead(@Request() req: any) {
    return this.notificationsService.markAllAsRead(req.user.userId);
  }

  @Post('broadcast')
  @ApiOperation({ summary: 'Send a broadcast notification (Admin only)' })
  @LogActivity({
    action: ActivityAction.CREATE,
    entityType: 'notifications',
    description: (ctx) => {
      const target = ctx.body.target;
      const title = ctx.body.title;
      if (target === 'ROLE') {
        return `Broadcast notification "${title}" to roles: ${ctx.body.role_names?.join(', ') || ctx.body.role_name}`;
      } else if (target === 'USERS') {
        return `Sent notification "${title}" to ${ctx.body.user_ids?.length || 0} users`;
      }
      return `Broadcast notification "${title}" to all users`;
    },
  })
  async broadcast(@Body() dto: BroadcastNotificationDto) {
    if (
      dto.target === NotificationTarget.ROLE &&
      (dto.role_names?.length || dto.role_name)
    ) {
      const roleNames = dto.role_names?.length
        ? dto.role_names
        : [dto.role_name!];
      await this.notificationsService.broadcastToRoles(
        roleNames,
        dto.title,
        dto.message,
        dto.type!,
        dto.meta_data,
      );
    } else if (
      dto.target === NotificationTarget.USERS &&
      dto.user_ids?.length
    ) {
      await this.notificationsService.sendToUsers(
        dto.user_ids,
        dto.title,
        dto.message,
        dto.type!,
        dto.meta_data,
      );
    } else {
      await this.notificationsService.broadcast(
        dto.title,
        dto.message,
        dto.type!,
        dto.meta_data,
      );
    }
    return { message: 'Broadcast notification dispatched successfully' };
  }
}
