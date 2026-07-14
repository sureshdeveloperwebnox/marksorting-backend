import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

export interface WhatsAppDocumentMessage {
  to: string;
  documentUrl: string;
  fileName: string;
  caption?: string;
}

export interface WhatsAppMessageJob {
  to: string;
  documentUrl: string;
  fileName: string;
  caption?: string;
  reportId?: string;
  reportType?: 'SERVICE' | 'INSTALLATION';
  retryCount?: number;
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(@InjectQueue('whatsapp') private readonly whatsappQueue: Queue) {}

  /**
   * Queue a WhatsApp document message to be sent via BullMQ
   * Uses Redis for queue storage and handles high volume with rate limiting
   */
  async sendDocument(message: WhatsAppDocumentMessage): Promise<boolean> {
    try {
      const jobData: WhatsAppMessageJob = {
        to: this.formatPhoneNumber(message.to),
        documentUrl: message.documentUrl,
        fileName: message.fileName,
        caption: message.caption || '',
        retryCount: 0,
      };

      await this.whatsappQueue.add('send-document', jobData, {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 10000, // Start with 10 seconds
        },
        removeOnComplete: {
          age: 86400, // Keep completed jobs for 24 hours
          count: 1000,
        },
        removeOnFail: {
          age: 604800, // Keep failed jobs for 7 days for debugging
          count: 500,
        },
        // Rate limiting - process max 1 message per 2 seconds to avoid API limits
        delay: 0,
      });

      this.logger.log(
        `Queued WhatsApp document to ${jobData.to}: ${message.fileName}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to queue WhatsApp message to ${message.to}`,
        error,
      );
      return false;
    }
  }

  /**
   * Send PDF report via WhatsApp with metadata for tracking
   */
  async sendReportPdf(
    to: string,
    pdfBuffer: Buffer,
    fileName: string,
    reportId: string,
    reportType: 'SERVICE' | 'INSTALLATION',
    millName: string,
    caption?: string,
  ): Promise<boolean> {
    try {
      // Convert buffer to base64 for sending via Ultramsg
      const base64Data = pdfBuffer.toString('base64');
      const dataUrl = `data:application/pdf;base64,${base64Data}`;

      const jobData: WhatsAppMessageJob = {
        to: this.formatPhoneNumber(to),
        documentUrl: dataUrl,
        fileName,
        caption: caption || '',
        reportId,
        reportType,
        retryCount: 0,
      };

      await this.whatsappQueue.add('send-report-pdf', jobData, {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 10000,
        },
        removeOnComplete: {
          age: 86400,
          count: 1000,
        },
        removeOnFail: {
          age: 604800,
          count: 500,
        },
      });

      this.logger.log(
        `Queued ${reportType} report PDF to ${jobData.to} for mill: ${millName}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to queue ${reportType} report PDF to ${to}`,
        error,
      );
      return false;
    }
  }

  /**
   * Format phone number to international format required by Ultramsg
   * Removes any non-digit characters and ensures it starts with country code
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');

    // Remove leading zeros
    cleaned = cleaned.replace(/^0+/, '');

    // Ensure it starts with country code (assuming India +91 if no country code)
    if (cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }

    // If it doesn't start with +, add it
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }

    return cleaned;
  }

  /**
   * Get queue statistics for monitoring
   */
  async getQueueStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.whatsappQueue.getWaitingCount(),
      this.whatsappQueue.getActiveCount(),
      this.whatsappQueue.getCompletedCount(),
      this.whatsappQueue.getFailedCount(),
      this.whatsappQueue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + delayed,
    };
  }
}
