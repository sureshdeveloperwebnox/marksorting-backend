import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { WhatsAppRabbitMQService, WhatsAppQueueMessage } from './whatsapp-rabbitmq.service';

@Injectable()
export class WhatsAppRabbitMQProcessor implements OnModuleInit {
  private readonly logger = new Logger(WhatsAppRabbitMQProcessor.name);
  private ultramsgApiUrl: string;
  private ultramsgToken: string;
  private ultramsgInstance: string;

  constructor(
    private readonly rabbitMQService: WhatsAppRabbitMQService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.ultramsgApiUrl = this.configService.get<string>('ULTRAMSG_API_URL', 'https://api.ultramsg.com');
    this.ultramsgToken = this.configService.get<string>('ULTRAMSG_TOKEN', '');
    this.ultramsgInstance = this.configService.get<string>('ULTRAMSG_INSTANCE', '');
  }

  async onModuleInit() {
    // Wait a bit for RabbitMQ service to connect, then start consuming
    await this.delay(3000); // Wait 3 seconds for connection to establish
    await this.startConsuming();
  }

  private async startConsuming(): Promise<void> {
    this.logger.log('Starting WhatsApp RabbitMQ consumer...');
    
    await this.rabbitMQService.consumeMessages(async (message: WhatsAppQueueMessage) => {
      return this.processMessage(message);
    });
  }

  /**
   * Process WhatsApp message from queue
   */
  private async processMessage(message: WhatsAppQueueMessage): Promise<boolean> {
    try {
      this.logger.log(`Sending WhatsApp document to ${message.to}`);

      // Rate limiting: Wait 2 seconds between messages
      await this.delay(2000);

      if (message.reportId && message.reportType) {
        // Send report PDF
        await this.sendDocument(
          message.to,
          message.documentUrl,
          message.fileName,
          message.caption,
        );
      } else {
        // Send regular document
        await this.sendDocument(
          message.to,
          message.documentUrl,
          message.fileName,
          message.caption,
        );
      }

      this.logger.log(`WhatsApp message sent successfully to ${message.to}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send WhatsApp to ${message.to} (attempt ${(message.retryCount || 0) + 1})`,
        error,
      );

      // Retry logic handled by RabbitMQ consumer
      return false;
    }
  }

  /**
   * Send document via Ultramsg API
   */
  private async sendDocument(
    to: string,
    documentUrl: string,
    fileName: string,
    caption?: string,
  ): Promise<void> {
    const url = `${this.ultramsgApiUrl}/${this.ultramsgInstance}/messages/document`;

    const payload = {
      token: this.ultramsgToken,
      to: this.formatPhoneNumber(to),
      document: documentUrl,
      filename: fileName,
      caption: caption || '',
    };

    try {
      const response = await lastValueFrom(
        this.httpService.post(url, payload, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }),
      );

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      this.logger.log(`Document sent successfully to ${to}`);
    } catch (error) {
      throw new Error(`Ultramsg API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Format phone number for international format
   */
  private formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/\D/g, '');
    cleaned = cleaned.replace(/^0+/, '');
    
    if (cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }
    
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    return cleaned;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
