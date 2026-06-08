import {
  Controller,
  Get,
  Query,
  UseGuards,
  Param,
  Res,
  Header,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Response } from 'express';
import { ActivityLogsService } from './activity-logs.service';
import { QueryActivityLogsDto } from './dto/query-activity-logs.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('activity-logs')
@Controller('activity-logs')
@UseGuards(JwtAuthGuard)
export class ActivityLogsController {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all activity logs with filtering and pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Activity logs retrieved successfully',
  })
  findAll(@Query() dto: QueryActivityLogsDto) {
    return this.activityLogsService.findAll(dto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get activity log statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getStats(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    return this.activityLogsService.getStats(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get activity logs for specific user' })
  @ApiResponse({
    status: 200,
    description: 'User activity retrieved successfully',
  })
  getUserActivity(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
  ) {
    return this.activityLogsService.getUserActivity(
      userId,
      limit ? parseInt(limit) : 100,
    );
  }

  @Get('entity/:entityType/:entityId')
  @ApiOperation({ summary: 'Get activity logs for specific entity' })
  @ApiResponse({
    status: 200,
    description: 'Entity activity retrieved successfully',
  })
  getEntityActivity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Query('limit') limit?: string,
  ) {
    return this.activityLogsService.getEntityActivity(
      entityType,
      entityId,
      limit ? parseInt(limit) : 100,
    );
  }

  @Get('export/excel')
  @ApiOperation({ summary: 'Export activity logs to Excel' })
  @ApiResponse({
    status: 200,
    description: 'Excel file downloaded successfully',
  })
  @Header(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  async exportToExcel(
    @Query() dto: QueryActivityLogsDto,
    @Res() res: Response,
  ) {
    const buffer = await this.activityLogsService.exportToExcel(dto);

    // Generate filename with date
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const filename = `activity_logs_${dateStr}.xlsx`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  }
}
