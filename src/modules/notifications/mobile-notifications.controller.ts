import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiParam,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';

// ── Inline Swagger schema fragments ─────────────────────────────────────────

const notificationSchema = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      format: 'uuid',
      example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    },
    user_id: {
      type: 'string',
      format: 'uuid',
      nullable: true,
      example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    },
    title: { type: 'string', example: 'New Service Report Created' },
    message: {
      type: 'string',
      example:
        'Service Report SR-20260528-1 has been created for mill "ABC Mill".',
    },
    type: {
      type: 'string',
      enum: [
        'SERVICE_REPORT',
        'INSTALLATION',
        'EXPENSE',
        'TICKET',
        'BROADCAST',
      ],
      example: 'SERVICE_REPORT',
    },
    status: { type: 'string', enum: ['UNREAD', 'READ'], example: 'UNREAD' },
    meta_data: {
      type: 'object',
      nullable: true,
      additionalProperties: true,
      example: { reportNumber: 'SR-20260528-1', millName: 'ABC Mill' },
    },
    created_at: {
      type: 'string',
      format: 'date-time',
      example: '2026-05-28T04:00:00.000Z',
    },
  },
};

const paginatedNotificationsSchema = {
  type: 'object',
  properties: {
    notifications: { type: 'array', items: notificationSchema },
    total: { type: 'integer', example: 50 },
    unreadCount: { type: 'integer', example: 5 },
  },
};

const errorSchema = (message: string) => ({
  type: 'object',
  properties: {
    statusCode: { type: 'integer' },
    message: { type: 'string', example: message },
  },
});

// ── Controller ───────────────────────────────────────────────────────────────

@ApiTags('mobile / notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('mobile/notifications')
export class MobileNotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // ── POST /push-token ──────────────────────────────────────────────────────

  @Post('push-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '[Mobile] Register FCM push token',
    description:
      'Registers or updates an FCM device push token for the authenticated user.\n\n' +
      'Call this on every app launch **after login** and whenever `onTokenRefresh` fires.\n\n' +
      '**Upsert behaviour:** If the same `token` already exists for this user it is updated in place ' +
      '(device_type may change). Duplicate tokens across different users are not allowed — ' +
      'deregister the old token first if the device changes hands.',
  })
  @ApiBody({ type: RegisterPushTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Token registered / updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        user_id: { type: 'string', format: 'uuid' },
        token: { type: 'string', example: 'fcm_token_string_here' },
        device_type: {
          type: 'string',
          enum: ['WEB', 'ANDROID', 'IOS'],
          example: 'ANDROID',
        },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error — missing or invalid token',
    schema: errorSchema('token should not be empty'),
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid JWT bearer token',
    schema: errorSchema('Unauthorized'),
  })
  registerPushToken(@Request() req: any, @Body() dto: RegisterPushTokenDto) {
    return this.notificationsService.registerPushToken(
      req.user.userId,
      dto.token,
      dto.device_type,
    );
  }

  // ── GET / ─────────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({
    summary: '[Mobile] List notifications for the logged-in technician',
    description:
      'Returns paginated notifications for the authenticated user ordered by `created_at DESC`.\n\n' +
      'The response also includes `total` (total record count) and `unreadCount` ' +
      '(number of UNREAD notifications) so the mobile app can render the badge without a separate call.\n\n' +
      '**Recommended page size:** `take=20` on initial load, then load more on scroll.',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    type: Number,
    description: 'Number of records to skip for pagination (default `0`)',
    example: 0,
  })
  @ApiQuery({
    name: 'take',
    required: false,
    type: Number,
    description:
      'Maximum number of records to return (default `20`, max recommended `50`)',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated notification list with unread count',
    schema: paginatedNotificationsSchema,
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid JWT bearer token',
    schema: errorSchema('Unauthorized'),
  })
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

  // ── PATCH /read-all ───────────────────────────────────────────────────────
  // NOTE: must come before /:id to avoid route collision

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '[Mobile] Mark all notifications as read',
    description:
      'Sets `status = READ` on **all** UNREAD notifications belonging to the authenticated user.\n\n' +
      'Returns a Prisma batch result with `count` indicating how many records were updated.\n\n' +
      'Safe to call even when there are zero unread notifications — returns `{ count: 0 }`.',
  })
  @ApiResponse({
    status: 200,
    description: 'All notifications marked as read',
    schema: {
      type: 'object',
      properties: {
        count: {
          type: 'integer',
          example: 5,
          description: 'Number of notifications updated',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid JWT bearer token',
    schema: errorSchema('Unauthorized'),
  })
  markAllAsRead(@Request() req: any) {
    return this.notificationsService.markAllAsRead(req.user.userId);
  }

  // ── PATCH /:id/read ───────────────────────────────────────────────────────

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '[Mobile] Mark a single notification as read',
    description:
      'Sets `status = READ` on the specified notification.\n\n' +
      'Returns **404** if the notification does not exist or does not belong to the authenticated user ' +
      "(ownership is strictly enforced — a user cannot mark another user's notification as read).",
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Notification UUID',
  })
  @ApiResponse({
    status: 200,
    description:
      'Notification marked as read — returns the updated notification object',
    schema: notificationSchema,
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid JWT bearer token',
    schema: errorSchema('Unauthorized'),
  })
  @ApiResponse({
    status: 404,
    description: 'Notification not found or does not belong to this user',
    schema: errorSchema('Notification not found'),
  })
  markAsRead(@Request() req: any, @Param('id') id: string) {
    return this.notificationsService.markAsRead(req.user.userId, id);
  }
}
