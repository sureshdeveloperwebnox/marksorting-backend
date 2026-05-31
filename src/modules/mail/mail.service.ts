import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { getForgotPasswordTemplate } from './templates/mail-templates';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    @InjectQueue('mail') private readonly mailQueue: Queue,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Puts email sending job into the BullMQ background queue for fast non-blocking responses
   */
  async sendMail(to: string, subject: string, html: string): Promise<boolean> {
    try {
      await this.mailQueue.add(
        'send-mail',
        { to, subject, html },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
          removeOnComplete: false,
          removeOnFail: false,
        },
      );
      this.logger.log(`Queued email for ${to} successfully.`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to queue email for ${to}`, error);
      return false;
    }
  }

  /**
   * Formats and queues a password reset email
   */
  async sendPasswordResetMail(to: string, name: string, token: string): Promise<boolean> {
    const frontendUrl = this.configService.get<string>('app.frontendUrl') || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
    const emailHtml = getForgotPasswordTemplate(name, resetUrl, 60);
    const subject = 'Reset Password - Mark Sorting System';
    
    return this.sendMail(to, subject, emailHtml);
  }
}
