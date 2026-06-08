import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { MailService } from '../mail/mail.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { ServiceReportsService } from '../service-reports/service-reports.service';
import { InstallationReportsService } from '../installation-reports/installation-reports.service';

export interface ReportDeliveryResult {
  emailSent: boolean;
  whatsappSent: boolean;
  emailError?: string;
  whatsappError?: string;
}

@Injectable()
export class ReportNotificationsService {
  private readonly logger = new Logger(ReportNotificationsService.name);

  constructor(
    private mailService: MailService,
    private whatsAppService: WhatsAppService,
    private serviceReportsService: ServiceReportsService,
    private installationReportsService: InstallationReportsService,
    @InjectQueue('mail') private readonly mailQueue: Queue,
  ) {}

  /**
   * Send Service Report via both Email and WhatsApp
   * - WhatsApp: Sends PDF only (no text)
   * - Email: "Please find attachment." + PDF attachment
   * - Subject: {mill_name} Service Report
   */
  async sendServiceReport(
    reportId: string,
    millName: string,
    millEmail: string | null | undefined,
    millWhatsappNumber: string,
  ): Promise<ReportDeliveryResult> {
    const result: ReportDeliveryResult = {
      emailSent: false,
      whatsappSent: false,
    };

    try {
      // Generate PDF
      this.logger.log(`Generating PDF for Service Report ${reportId}...`);
      const { buffer: pdfBuffer, fileName } =
        await this.serviceReportsService.generatePdf(reportId);

      // Send WhatsApp (PDF only, no text)
      if (millWhatsappNumber) {
        try {
          result.whatsappSent = await this.whatsAppService.sendReportPdf(
            millWhatsappNumber,
            pdfBuffer,
            fileName,
            reportId,
            'SERVICE',
            millName,
          );
          this.logger.log(
            `WhatsApp queued for Service Report ${reportId} to ${millWhatsappNumber}`,
          );
        } catch (error) {
          result.whatsappError =
            error instanceof Error ? error.message : 'WhatsApp sending failed';
          this.logger.error(
            `WhatsApp failed for Service Report ${reportId}`,
            error,
          );
        }
      } else {
        this.logger.warn(`No WhatsApp number for Service Report ${reportId}`);
      }

      // Send Email with attachment
      if (millEmail) {
        try {
          const subject = `${millName} Service Report`;
          const html = this.getServiceReportEmailTemplate(millName);

          // Convert buffer to base64 for email attachment
          const base64Content = pdfBuffer.toString('base64');

          // Queue email with attachment - using the mail service
          // Since the existing mail service doesn't support attachments directly,
          // we'll need to add a new method or use a direct approach
          result.emailSent = await this.sendEmailWithAttachment(
            millEmail,
            subject,
            html,
            fileName,
            pdfBuffer,
          );

          this.logger.log(
            `Email queued for Service Report ${reportId} to ${millEmail}`,
          );
        } catch (error) {
          result.emailError =
            error instanceof Error ? error.message : 'Email sending failed';
          this.logger.error(
            `Email failed for Service Report ${reportId}`,
            error,
          );
        }
      } else {
        this.logger.warn(`No email for Service Report ${reportId}`);
      }

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to send Service Report ${reportId}: ${errorMsg}`,
        error,
      );
      result.emailError = result.emailError || errorMsg;
      result.whatsappError = result.whatsappError || errorMsg;
      return result;
    }
  }

  /**
   * Send Installation Report via both Email and WhatsApp
   * - WhatsApp: Sends PDF only (no text)
   * - Email: "Please find attachment." + PDF attachment
   * - Subject: {mill_name} Installation Report
   */
  async sendInstallationReport(
    reportId: string,
    millName: string,
    millEmail: string | null | undefined,
    millWhatsappNumber: string,
  ): Promise<ReportDeliveryResult> {
    const result: ReportDeliveryResult = {
      emailSent: false,
      whatsappSent: false,
    };

    try {
      // Generate PDF
      this.logger.log(`Generating PDF for Installation Report ${reportId}...`);
      const { buffer: pdfBuffer, fileName } =
        await this.installationReportsService.generatePdf(reportId);

      // Send WhatsApp (PDF only, no text)
      if (millWhatsappNumber) {
        try {
          result.whatsappSent = await this.whatsAppService.sendReportPdf(
            millWhatsappNumber,
            pdfBuffer,
            fileName,
            reportId,
            'INSTALLATION',
            millName,
          );
          this.logger.log(
            `WhatsApp queued for Installation Report ${reportId} to ${millWhatsappNumber}`,
          );
        } catch (error) {
          result.whatsappError =
            error instanceof Error ? error.message : 'WhatsApp sending failed';
          this.logger.error(
            `WhatsApp failed for Installation Report ${reportId}`,
            error,
          );
        }
      } else {
        this.logger.warn(
          `No WhatsApp number for Installation Report ${reportId}`,
        );
      }

      // Send Email with attachment
      if (millEmail) {
        try {
          const subject = `${millName} Installation Report`;
          const html = this.getInstallationReportEmailTemplate(millName);

          result.emailSent = await this.sendEmailWithAttachment(
            millEmail,
            subject,
            html,
            fileName,
            pdfBuffer,
          );

          this.logger.log(
            `Email queued for Installation Report ${reportId} to ${millEmail}`,
          );
        } catch (error) {
          result.emailError =
            error instanceof Error ? error.message : 'Email sending failed';
          this.logger.error(
            `Email failed for Installation Report ${reportId}`,
            error,
          );
        }
      } else {
        this.logger.warn(`No email for Installation Report ${reportId}`);
      }

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to send Installation Report ${reportId}: ${errorMsg}`,
        error,
      );
      result.emailError = result.emailError || errorMsg;
      result.whatsappError = result.whatsappError || errorMsg;
      return result;
    }
  }

  /**
   * Send email with PDF attachment using the mail queue
   */
  private async sendEmailWithAttachment(
    to: string,
    subject: string,
    html: string,
    fileName: string,
    pdfBuffer: Buffer,
  ): Promise<boolean> {
    try {
      await this.mailQueue.add(
        'send-mail-with-attachment',
        {
          to,
          subject,
          html,
          attachments: [
            {
              filename: fileName,
              content: pdfBuffer.toString('base64'),
              encoding: 'base64',
              contentType: 'application/pdf',
            },
          ],
        },
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

      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Email template for Service Report
   */
  private getServiceReportEmailTemplate(millName: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f4f4f4; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .footer { background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Service Report</h2>
    </div>
    <div class="content">
      <p>Dear ${millName},</p>
      <p>Please find attachment.</p>
      <p>Thank you for choosing our services.</p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Email template for Installation Report
   */
  private getInstallationReportEmailTemplate(millName: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f4f4f4; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .footer { background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Installation Report</h2>
    </div>
    <div class="content">
      <p>Dear ${millName},</p>
      <p>Please find attachment.</p>
      <p>Thank you for choosing our services.</p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }
}
