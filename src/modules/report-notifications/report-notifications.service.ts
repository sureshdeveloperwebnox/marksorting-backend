import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { MailService } from '../mail/mail.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { ServiceReportsService } from '../service-reports/service-reports.service';
import { InstallationReportsService } from '../installation-reports/installation-reports.service';
import { PrismaService } from '../../prisma/prisma.service';

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
    private prisma: PrismaService,
    private mailService: MailService,
    private whatsAppService: WhatsAppService,
    private serviceReportsService: ServiceReportsService,
    private installationReportsService: InstallationReportsService,
    @InjectQueue('mail') private readonly mailQueue: Queue,
  ) {}

  /**
   * Send Service Report via both Email and WhatsApp to assigned engineers
   * - WhatsApp: Sends PDF only (no text)
   * - Email: "Please find attachment." + PDF attachment
   * - Subject: {mill_name} Service Report
   */
  async sendServiceReport(
    reportId: string,
    millName: string,
    _millEmail: string | null | undefined,
    _millWhatsappNumber: string,
    _authorizedPersonPhone?: string,
  ): Promise<ReportDeliveryResult> {
    const result: ReportDeliveryResult = {
      emailSent: false,
      whatsappSent: false,
    };

    try {
      const report = await this.prisma.serviceReport.findUnique({
        where: { id: reportId },
        include: {
          mill: { select: { name: true } },
          technicians: {
            include: {
              technician: true,
            },
          },
        },
      });

      if (!report) {
        throw new Error(`Service Report ${reportId} not found`);
      }

      const activeMillName = report.mill?.name || millName || 'Unknown Mill';
      this.logger.debug(
        `Original mill details: email=${_millEmail || 'none'}, whatsapp=${_millWhatsappNumber || 'none'}`,
      );

      // Generate PDF
      this.logger.log(`Generating PDF for Service Report ${reportId}...`);
      const { buffer: pdfBuffer, fileName } =
        await this.serviceReportsService.generatePdf(reportId);

      const assignedTechnicians = report.technicians
        .map((t) => t.technician)
        .filter(Boolean);

      if (assignedTechnicians.length === 0) {
        this.logger.warn(
          `No assigned technicians for Service Report ${reportId}`,
        );
        return result;
      }

      const formattedDate = report.visit_date
        ? new Date(report.visit_date).toLocaleDateString('en-GB')
        : '—';
      const caption = `*Service Report Created*\n\n` +
        `*Report No:* ${report.report_number || '—'}\n` +
        `*Mill Name:* ${activeMillName}\n` +
        `*Place:* ${report.place || '—'}\n` +
        `*Date:* ${formattedDate}\n` +
        `*Model:* ${report.machine_model || '—'}\n` +
        `*Serial/Frame No:* ${report.serial_or_frame_no || '—'}\n` +
        `*Authorized Person:* ${report.authorized_person || '—'}\n\n` +
        `Please find the attached Service Report PDF.`;

      // Loop and send to each assigned technician
      for (const technician of assignedTechnicians) {
        const techEmail = technician.email;
        const techPhone = technician.phone;

        this.logger.log(
          `Sending Service Report ${reportId} notification to engineer ${technician.full_name} (Email: ${techEmail}, Phone: ${techPhone})`,
        );

        // Send WhatsApp
        if (techPhone) {
          try {
            const sent = await this.whatsAppService.sendReportPdf(
              techPhone,
              pdfBuffer,
              fileName,
              reportId,
              'SERVICE',
              activeMillName,
              caption,
            );
            if (sent) result.whatsappSent = true;
            this.logger.log(
              `WhatsApp queued for Service Report ${reportId} to technician ${technician.full_name} (${techPhone})`,
            );
          } catch (error) {
            result.whatsappError =
              error instanceof Error
                ? error.message
                : 'WhatsApp sending failed';
            this.logger.error(
              `WhatsApp failed for Service Report ${reportId} to technician ${technician.full_name}`,
              error,
            );
          }
        }

        // Send Email with attachment
        if (techEmail) {
          try {
            const subject = `${activeMillName} Service Report`;
            const html = this.getServiceReportEmailTemplate(activeMillName);

            const sent = await this.sendEmailWithAttachment(
              techEmail,
              subject,
              html,
              fileName,
              pdfBuffer,
            );
            if (sent) result.emailSent = true;

            this.logger.log(
              `Email queued for Service Report ${reportId} to technician ${technician.full_name} (${techEmail})`,
            );
          } catch (error) {
            result.emailError =
              error instanceof Error ? error.message : 'Email sending failed';
            this.logger.error(
              `Email failed for Service Report ${reportId} to technician ${technician.full_name}`,
              error,
            );
          }
        }
      }

      // Send WhatsApp to authorized person if phone number is provided,
      // but only if they haven't already been notified as a technician
      if (_authorizedPersonPhone) {
        const normalizedAuthPhone = this.normalizePhone(_authorizedPersonPhone);
        const alreadySentPhones = assignedTechnicians
          .map((t) => t.phone)
          .filter(Boolean)
          .map((p) => this.normalizePhone(p!));
        const alreadyNotified = alreadySentPhones.includes(normalizedAuthPhone);

        if (alreadyNotified) {
          this.logger.log(
            `Skipping Service Report ${reportId} authorized person WhatsApp (${_authorizedPersonPhone}) — already sent to this number as a technician.`,
          );
        } else {
          try {
            this.logger.log(
              `Sending Service Report ${reportId} WhatsApp to authorized person (${_authorizedPersonPhone})`,
            );
            const sent = await this.whatsAppService.sendReportPdf(
              _authorizedPersonPhone,
              pdfBuffer,
              fileName,
              reportId,
              'SERVICE',
              activeMillName,
              caption,
            );
            if (sent) result.whatsappSent = true;
            this.logger.log(
              `WhatsApp queued for Service Report ${reportId} to authorized person (${_authorizedPersonPhone})`,
            );
          } catch (error) {
            result.whatsappError =
              error instanceof Error
                ? error.message
                : 'WhatsApp sending failed';
            this.logger.error(
              `WhatsApp failed for Service Report ${reportId} to authorized person`,
              error,
            );
          }
        }
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
   * Send Installation Report via both Email and WhatsApp to assigned engineers
   * - WhatsApp: Sends PDF only (no text)
   * - Email: "Please find attachment." + PDF attachment
   * - Subject: {mill_name} Installation Report
   */
  async sendInstallationReport(
    reportId: string,
    millName: string,
    _millEmail: string | null | undefined,
    _millWhatsappNumber: string,
    _authorizedPersonPhone?: string,
  ): Promise<ReportDeliveryResult> {
    const result: ReportDeliveryResult = {
      emailSent: false,
      whatsappSent: false,
    };

    try {
      const report = await this.prisma.installationReport.findUnique({
        where: { id: reportId },
        include: {
          mill: { select: { name: true } },
          technicians: {
            include: {
              technician: true,
            },
          },
        },
      });

      if (!report) {
        throw new Error(`Installation Report ${reportId} not found`);
      }

      const activeMillName = report.mill?.name || millName || 'Unknown Mill';
      this.logger.debug(
        `Original mill details: email=${_millEmail || 'none'}, whatsapp=${_millWhatsappNumber || 'none'}`,
      );

      // Generate PDF
      this.logger.log(`Generating PDF for Installation Report ${reportId}...`);
      const { buffer: pdfBuffer, fileName } =
        await this.installationReportsService.generatePdf(reportId);

      const assignedTechnicians = report.technicians
        .map((t) => t.technician)
        .filter(Boolean);

      if (assignedTechnicians.length === 0) {
        this.logger.warn(
          `No assigned technicians for Installation Report ${reportId}`,
        );
        return result;
      }

      const formattedDate = report.visit_date
        ? new Date(report.visit_date).toLocaleDateString('en-GB')
        : '—';
      const caption = `*Installation Report Created*\n\n` +
        `*Report No:* ${report.report_number || '—'}\n` +
        `*Mill Name:* ${activeMillName}\n` +
        `*Place:* ${report.place || '—'}\n` +
        `*Date:* ${formattedDate}\n` +
        `*Model:* ${report.machine_model || '—'}\n` +
        `*Serial/Frame No:* ${report.serial_or_frame_no || '—'}\n` +
        `*Authorized Person:* ${report.authorized_person || '—'}\n\n` +
        `Please find the attached Installation Report PDF.`;

      // Loop and send to each assigned technician
      for (const technician of assignedTechnicians) {
        const techEmail = technician.email;
        const techPhone = technician.phone;

        this.logger.log(
          `Sending Installation Report ${reportId} notification to engineer ${technician.full_name} (Email: ${techEmail}, Phone: ${techPhone})`,
        );

        // Send WhatsApp
        if (techPhone) {
          try {
            const sent = await this.whatsAppService.sendReportPdf(
              techPhone,
              pdfBuffer,
              fileName,
              reportId,
              'INSTALLATION',
              activeMillName,
              caption,
            );
            if (sent) result.whatsappSent = true;
            this.logger.log(
              `WhatsApp queued for Installation Report ${reportId} to technician ${technician.full_name} (${techPhone})`,
            );
          } catch (error) {
            result.whatsappError =
              error instanceof Error
                ? error.message
                : 'WhatsApp sending failed';
            this.logger.error(
              `WhatsApp failed for Installation Report ${reportId} to technician ${technician.full_name}`,
              error,
            );
          }
        }

        // Send Email with attachment
        if (techEmail) {
          try {
            const subject = `${activeMillName} Installation Report`;
            const html =
              this.getInstallationReportEmailTemplate(activeMillName);

            const sent = await this.sendEmailWithAttachment(
              techEmail,
              subject,
              html,
              fileName,
              pdfBuffer,
            );
            if (sent) result.emailSent = true;

            this.logger.log(
              `Email queued for Installation Report ${reportId} to technician ${technician.full_name} (${techEmail})`,
            );
          } catch (error) {
            result.emailError =
              error instanceof Error ? error.message : 'Email sending failed';
            this.logger.error(
              `Email failed for Installation Report ${reportId} to technician ${technician.full_name}`,
              error,
            );
          }
        }
      }

      // Send WhatsApp to authorized person if phone number is provided,
      // but only if they haven't already been notified as a technician
      if (_authorizedPersonPhone) {
        const normalizedAuthPhone = this.normalizePhone(_authorizedPersonPhone);
        const alreadySentPhones = assignedTechnicians
          .map((t) => t.phone)
          .filter(Boolean)
          .map((p) => this.normalizePhone(p!));
        const alreadyNotified = alreadySentPhones.includes(normalizedAuthPhone);

        if (alreadyNotified) {
          this.logger.log(
            `Skipping Installation Report ${reportId} authorized person WhatsApp (${_authorizedPersonPhone}) — already sent to this number as a technician.`,
          );
        } else {
          try {
            this.logger.log(
              `Sending Installation Report ${reportId} WhatsApp to authorized person (${_authorizedPersonPhone})`,
            );
            const sent = await this.whatsAppService.sendReportPdf(
              _authorizedPersonPhone,
              pdfBuffer,
              fileName,
              reportId,
              'INSTALLATION',
              activeMillName,
              caption,
            );
            if (sent) result.whatsappSent = true;
            this.logger.log(
              `WhatsApp queued for Installation Report ${reportId} to authorized person (${_authorizedPersonPhone})`,
            );
          } catch (error) {
            result.whatsappError =
              error instanceof Error
                ? error.message
                : 'WhatsApp sending failed';
            this.logger.error(
              `WhatsApp failed for Installation Report ${reportId} to authorized person`,
              error,
            );
          }
        }
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
   * Normalize a phone number to digits only for deduplication comparison.
   * Strips leading +, country codes (91 for India), spaces, dashes etc.
   * Returns the last 10 digits so both "7358921423" and "+917358921423" compare equal.
   */
  private normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    // Return last 10 digits to handle country-code variations
    return digits.slice(-10);
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
