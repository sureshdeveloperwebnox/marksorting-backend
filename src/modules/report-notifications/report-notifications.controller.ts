import {
  Controller,
  Post,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Logger,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WhatsAppService } from '../whatsapp/whatsapp.service';

class SendPdfDto {
  millWhatsappNumber?: string;
  millEmail?: string;
}

@ApiTags('Report Notifications')
@Controller('report-notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportNotificationsController {
  private readonly logger = new Logger(ReportNotificationsController.name);

  constructor(
    private eventEmitter: EventEmitter2,
    private whatsAppService: WhatsAppService,
  ) {}

  /**
   * Manually send Service Report PDF via WhatsApp and Email
   * Can be triggered from admin dashboard
   */
  @Post('service-reports/:id/send-pdf')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send Service Report PDF manually via WhatsApp and Email',
  })
  @ApiParam({ name: 'id', description: 'Service Report ID' })
  @ApiResponse({
    status: 200,
    description: 'PDF send request queued successfully',
  })
  @ApiResponse({ status: 404, description: 'Service report not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async sendServiceReportPdf(
    @Param('id') reportId: string,
    @Body() dto: SendPdfDto,
    @Request() req: any,
  ) {
    const userId = req.user?.userId;

    this.logger.log(
      `Manual PDF send requested for Service Report ${reportId} by user ${userId}`,
    );

    // Emit event for manual PDF delivery
    this.eventEmitter.emit('service-report.send-pdf', {
      reportId,
      triggeredBy: userId,
      millWhatsappNumber: dto.millWhatsappNumber,
      millEmail: dto.millEmail,
    });

    return {
      success: true,
      message: 'Service Report PDF delivery has been queued',
      reportId,
    };
  }

  /**
   * Manually send Installation Report PDF via WhatsApp and Email
   * Can be triggered from admin dashboard
   */
  @Post('installation-reports/:id/send-pdf')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send Installation Report PDF manually via WhatsApp and Email',
  })
  @ApiParam({ name: 'id', description: 'Installation Report ID' })
  @ApiResponse({
    status: 200,
    description: 'PDF send request queued successfully',
  })
  @ApiResponse({ status: 404, description: 'Installation report not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async sendInstallationReportPdf(
    @Param('id') reportId: string,
    @Body() dto: SendPdfDto,
    @Request() req: any,
  ) {
    const userId = req.user?.userId;

    this.logger.log(
      `Manual PDF send requested for Installation Report ${reportId} by user ${userId}`,
    );

    // Emit event for manual PDF delivery
    this.eventEmitter.emit('installation-report.send-pdf', {
      reportId,
      triggeredBy: userId,
      millWhatsappNumber: dto.millWhatsappNumber,
      millEmail: dto.millEmail,
    });

    return {
      success: true,
      message: 'Installation Report PDF delivery has been queued',
      reportId,
    };
  }

  /**
   * Get WhatsApp queue statistics for monitoring
   */
  @Post('whatsapp/stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get WhatsApp queue statistics' })
  @ApiResponse({
    status: 200,
    description: 'Queue statistics retrieved successfully',
  })
  async getWhatsAppQueueStats() {
    const stats = await this.whatsAppService.getQueueStats();
    return {
      success: true,
      data: stats,
    };
  }
}
