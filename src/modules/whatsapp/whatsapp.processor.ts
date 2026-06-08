import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { WhatsAppMessageJob } from './whatsapp.service';
import { PrismaService } from '../../prisma/prisma.service';

@Processor('whatsapp', {
  concurrency: 2, // Process 2 jobs concurrently - balance between speed and API limits
  limiter: {
    max: 30, // Max 30 jobs per duration window
    duration: 60000, // Per 60 seconds (1 minute) - safe rate limiting
  },
})
export class WhatsAppProcessor extends WorkerHost {
  private readonly logger = new Logger(WhatsAppProcessor.name);
  private readonly isMockMode: boolean;
  private readonly apiToken: string;
  private readonly instanceId: string;
  private readonly baseUrl: string;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private prisma: PrismaService,
  ) {
    super();

    this.apiToken = this.configService.get<string>('whatsapp.apiToken') || '';
    this.instanceId =
      this.configService.get<string>('whatsapp.instanceId') || '';
    this.baseUrl =
      this.configService.get<string>('whatsapp.baseUrl') ||
      'https://api.ultramsg.com';

    this.isMockMode = !this.apiToken || !this.instanceId;

    if (this.isMockMode) {
      this.logger.warn(
        'WhatsApp credentials not configured. Running in MOCK MODE.',
      );
    } else {
      this.logger.log(
        `WhatsApp processor initialized for instance: ${this.instanceId}`,
      );
    }
  }

  async process(job: Job<WhatsAppMessageJob>) {
    switch (job.name) {
      case 'send-document':
        await this.handleSendDocument(job);
        break;
      case 'send-report-pdf':
        await this.handleSendReportPdf(job);
        break;
      default:
        this.logger.warn(`Unknown job type: ${job.name}`);
    }
  }

  private async handleSendDocument(job: Job<WhatsAppMessageJob>) {
    const { to, documentUrl, fileName, caption } = job.data;

    if (this.isMockMode) {
      this.logger.log(
        `[Mock WhatsApp] Would send document:\n` +
          `  To: ${to}\n` +
          `  File: ${fileName}\n` +
          `  Caption: ${caption || '(none)'}`,
      );
      return;
    }

    if (!to) {
      throw new Error('Recipient phone number (to) is required');
    }

    const phoneNumber: string = to;
    const docCaption: string = caption || '';
    await this.sendDocumentViaUltramsg(
      phoneNumber,
      documentUrl,
      fileName || '',
      docCaption,
      job,
    );
  }

  private async handleSendReportPdf(job: Job<WhatsAppMessageJob>) {
    const { to, documentUrl, fileName, reportId, reportType } = job.data;

    if (this.isMockMode) {
      this.logger.log(
        `[Mock WhatsApp] Would send ${reportType} report PDF:\n` +
          `  To: ${to}\n` +
          `  File: ${fileName}\n` +
          `  Report ID: ${reportId}`,
      );

      // Log to notification logs even in mock mode for testing
      await this.logNotificationAttempt(
        reportId || '',
        reportType || 'SERVICE',
        to || '',
        'FAILED',
        'Mock mode - not sent',
      );
      return;
    }

    if (!to) {
      throw new Error('Recipient phone number (to) is required');
    }

    const phoneNumber: string = to;
    const docName: string = fileName || '';
    const docUrl: string = documentUrl || '';

    try {
      await this.sendDocumentViaUltramsg(phoneNumber, docUrl, docName, '', job);

      // Log successful notification
      if (reportId) {
        await this.logNotificationAttempt(
          reportId,
          reportType || 'SERVICE',
          phoneNumber,
          'SENT',
        );
      }

      this.logger.log(
        `Successfully sent ${reportType} report PDF to ${phoneNumber}`,
      );
    } catch (error) {
      // Log failed notification
      if (reportId) {
        await this.logNotificationAttempt(
          reportId,
          reportType || 'SERVICE',
          phoneNumber,
          'FAILED',
          error instanceof Error ? error.message : 'Unknown error',
        );
      }
      throw error; // Let BullMQ handle retry
    }
  }

  private async sendDocumentViaUltramsg(
    to: string,
    documentUrl: string,
    fileName: string,
    caption: string,
    job: Job<WhatsAppMessageJob>,
  ) {
    const apiUrl = `${this.baseUrl}/${this.instanceId}/messages/document`;

    const payload = {
      token: this.apiToken,
      to: to.replace('+', ''), // Ultramsg expects numbers without + prefix
      filename: fileName,
      document: documentUrl,
      caption: caption || undefined,
    };

    try {
      const response = await lastValueFrom(
        this.httpService.post(apiUrl, payload, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 second timeout
        }),
      );

      // Check Ultramsg response
      const responseData = response.data;

      if (responseData.error) {
        throw new Error(`Ultramsg API error: ${responseData.error}`);
      }

      this.logger.log(
        `WhatsApp document sent successfully to ${to}. ` +
          `Message ID: ${responseData.id || 'N/A'}`,
      );

      return responseData;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to send WhatsApp document to ${to} (Attempt ${job.attemptsMade + 1}/${job.opts.attempts}): ${errorMessage}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Log notification attempt to database for tracking
   */
  private async logNotificationAttempt(
    reportId: string,
    reportType: 'SERVICE' | 'INSTALLATION',
    recipientPhone: string,
    status: 'SENT' | 'DELIVERED' | 'FAILED' | 'OPENED',
    errorMessage?: string,
  ) {
    try {
      await this.prisma.notificationLog.create({
        data: {
          notification_type: 'WHATSAPP',
          channel:
            reportType === 'SERVICE' ? 'Service Report' : 'Installation Report',
          status,
          provider: 'Ultramsg',
          provider_message_id: reportId,
          error_message: errorMessage,
          sent_at: status === 'SENT' ? new Date() : undefined,
        },
      });
    } catch (logError) {
      // Don't throw - logging failures shouldn't break the main flow
      this.logger.error('Failed to log notification attempt', logError);
    }
  }
}
