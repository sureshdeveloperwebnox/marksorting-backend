import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

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
      this.logger.error('Failed to initialize Nodemailer SMTP Transporter. Falling back to Mock Mode.', error);
      this.isMockMode = true;
    }
  }

  async process(job: Job<any>) {
    if (job.name === 'send-mail') {
      await this.handleSendMail(job);
    }
  }

  private async handleSendMail(job: Job<any>) {
    const { to, subject, html } = job.data;
    const fromName = this.configService.get<string>('mail.fromName') || 'Mark Sorting System';
    const fromUser = this.configService.get<string>('mail.user') || 'no-reply@marksorting.com';

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
      const info = await this.transporter.sendMail({
        from: `"${fromName}" <${fromUser}>`,
        to,
        subject,
        html,
      });

      this.logger.log(`Email successfully sent to ${to}. MessageId: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to} for job ${job.id}`, error);
      throw error; // Let BullMQ handle retries and backoff
    }
  }
}
