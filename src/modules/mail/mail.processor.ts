import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as path from 'path';
import * as fs from 'fs';

@Processor('mail')
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);
  private transporter: nodemailer.Transporter | null = null;
  private isMockMode = false;

  constructor(private configService: ConfigService) {
    super();
    this.initTransporter();
  }

  private initTransporter() {
    const host = this.configService.get<string>('mail.host');
    const port = this.configService.get<number>('mail.port');
    const user = this.configService.get<string>('mail.user');
    const pass = this.configService.get<string>('mail.pass');

    if (!user || !pass) {
      this.logger.warn(
        'SMTP credentials not fully provided. Running Mail Service in MOCK MODE (logging emails to console).',
      );
      this.isMockMode = true;
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user,
          pass,
        },
      });
      this.logger.log('Nodemailer SMTP Transporter initialized successfully.');
    } catch (error) {
      this.logger.error(
        'Failed to initialize Nodemailer SMTP Transporter. Falling back to Mock Mode.',
        error,
      );
      this.isMockMode = true;
    }
  }

  async process(job: Job<any>) {
    if (job.name === 'send-mail') {
      await this.handleSendMail(job);
    } else if (job.name === 'send-mail-with-attachment') {
      await this.handleSendMailWithAttachment(job);
    }
  }

  private async handleSendMail(job: Job<any>) {
    const { to, subject, html } = job.data;
    const fromName =
      this.configService.get<string>('mail.fromName') || 'Mark Sorting System';
    const fromUser =
      this.configService.get<string>('mail.user') || 'no-reply@marksorting.com';

    if (this.isMockMode || !this.transporter) {
      this.logger.log(
        `[Mock Email] Sending Email:\n` +
          `  To: ${to}\n` +
          `  From: "${fromName}" <${fromUser}>\n` +
          `  Subject: ${subject}\n` +
          `  HTML Length: ${html?.length || 0} characters`,
      );
      return;
    }

    try {
      // Find the logo image file in the assets directory
      let logoPath = path.join(__dirname, 'assets', 'logo.png');
      if (!fs.existsSync(logoPath)) {
        // Fallback for ts-node development mode
        logoPath = path.join(
          process.cwd(),
          'src',
          'modules',
          'mail',
          'assets',
          'logo.png',
        );
      }

      const attachments: any[] = [];
      if (fs.existsSync(logoPath)) {
        attachments.push({
          filename: 'logo.png',
          path: logoPath,
          cid: 'logo',
        });
      } else {
        this.logger.warn(
          `Logo image not found at ${logoPath}. Sending email without logo attachment.`,
        );
      }

      const info = await this.transporter.sendMail({
        from: `"${fromName}" <${fromUser}>`,
        to,
        subject,
        html,
        attachments,
      });

      this.logger.log(
        `Email successfully sent to ${to}. MessageId: ${info.messageId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${to} for job ${job.id}`,
        error,
      );
      throw error; // Let BullMQ handle retries and backoff
    }
  }

  private async handleSendMailWithAttachment(job: Job<any>) {
    const { to, subject, html, attachments } = job.data;
    const fromName =
      this.configService.get<string>('mail.fromName') || 'Mark Sorting System';
    const fromUser =
      this.configService.get<string>('mail.user') || 'no-reply@marksorting.com';

    if (this.isMockMode || !this.transporter) {
      this.logger.log(
        `[Mock Email with Attachment] Sending Email:\n` +
          `  To: ${to}\n` +
          `  From: "${fromName}" <${fromUser}>\n` +
          `  Subject: ${subject}\n` +
          `  HTML Length: ${html?.length || 0} characters\n` +
          `  Attachments: ${attachments?.length || 0} files`,
      );
      return;
    }

    try {
      // Find the logo image file in the assets directory
      let logoPath = path.join(__dirname, 'assets', 'logo.png');
      if (!fs.existsSync(logoPath)) {
        // Fallback for ts-node development mode
        logoPath = path.join(
          process.cwd(),
          'src',
          'modules',
          'mail',
          'assets',
          'logo.png',
        );
      }

      const emailAttachments: any[] = [];

      // Add logo if exists
      if (fs.existsSync(logoPath)) {
        emailAttachments.push({
          filename: 'logo.png',
          path: logoPath,
          cid: 'logo',
        });
      }

      // Add provided attachments
      if (attachments && Array.isArray(attachments)) {
        for (const attachment of attachments) {
          emailAttachments.push({
            filename: attachment.filename,
            content: Buffer.from(
              attachment.content,
              attachment.encoding || 'base64',
            ),
            contentType: attachment.contentType || 'application/octet-stream',
          });
        }
      }

      const info = await this.transporter.sendMail({
        from: `"${fromName}" <${fromUser}>`,
        to,
        subject,
        html,
        attachments: emailAttachments,
      });

      this.logger.log(
        `Email with attachment successfully sent to ${to}. MessageId: ${info.messageId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send email with attachment to ${to} for job ${job.id}`,
        error,
      );
      throw error; // Let BullMQ handle retries and backoff
    }
  }
}
