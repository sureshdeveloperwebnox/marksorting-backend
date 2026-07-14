import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ReportNotificationsService } from './report-notifications.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportNotificationsEventListener {
  private readonly logger = new Logger(ReportNotificationsEventListener.name);

  constructor(
    private reportNotificationsService: ReportNotificationsService,
    private prisma: PrismaService,
  ) {}

  /**
   * Handle service report created event
   * Sends PDF via WhatsApp and Email automatically
   */
  @OnEvent('service-report.created.send-pdf')
  async onServiceReportCreatedForPdf(payload: {
    reportId: string;
    reportNumber: string;
    millId: string;
    millName: string;
    millWhatsappNumber?: string;
    millEmail?: string;
    authorizedPersonPhone?: string;
  }) {
    try {
      const {
        reportId,
        reportNumber,
        millId,
        millName,
        millWhatsappNumber,
        millEmail,
        authorizedPersonPhone,
      } = payload;

      this.logger.log(
        `Processing service-report.created.send-pdf event for report ${reportNumber}`,
      );

      // If contact details not provided in payload, fetch from database
      let whatsappNumber = millWhatsappNumber;
      let email = millEmail;
      let authPersonPhone = authorizedPersonPhone;

      if (!whatsappNumber || !email || !authPersonPhone) {
        const report = await this.prisma.serviceReport.findUnique({
          where: { id: reportId },
          select: {
            mill_whatsapp_number: true,
            mill_email: true,
            authorized_person_phone: true,
          },
        });

        if (report) {
          whatsappNumber =
            whatsappNumber || report.mill_whatsapp_number || undefined;
          email = email || report.mill_email || undefined;
          authPersonPhone =
            authPersonPhone || report.authorized_person_phone || undefined;
        }
      }

      if (!whatsappNumber && !email && !authPersonPhone) {
        this.logger.warn(
          `No contact information available for Service Report ${reportNumber}. Skipping PDF delivery.`,
        );
        return;
      }

      // Send the report
      const result = await this.reportNotificationsService.sendServiceReport(
        reportId,
        millName,
        email,
        whatsappNumber || '',
        authPersonPhone || '',
      );

      if (result.whatsappSent || result.emailSent) {
        this.logger.log(
          `Service Report ${reportNumber} PDF delivery initiated. ` +
            `WhatsApp: ${result.whatsappSent}, Email: ${result.emailSent}`,
        );
      } else {
        this.logger.error(
          `Failed to deliver Service Report ${reportNumber} PDF. ` +
            `WhatsApp Error: ${result.whatsappError || 'N/A'}, ` +
            `Email Error: ${result.emailError || 'N/A'}`,
        );
      }
    } catch (error) {
      this.logger.error(
        'Error handling service-report.created.send-pdf event',
        error,
      );
    }
  }

  /**
   * Handle installation report created event
   * Sends PDF via WhatsApp and Email automatically
   */
  @OnEvent('installation-report.created.send-pdf')
  async onInstallationReportCreatedForPdf(payload: {
    reportId: string;
    reportNumber: string;
    millId: string;
    millName: string;
    millWhatsappNumber?: string;
    millEmail?: string;
    authorizedPersonPhone?: string;
  }) {
    try {
      const {
        reportId,
        reportNumber,
        millId,
        millName,
        millWhatsappNumber,
        millEmail,
        authorizedPersonPhone,
      } = payload;

      this.logger.log(
        `Processing installation-report.created.send-pdf event for report ${reportNumber}`,
      );

      // If contact details not provided in payload, fetch from database
      let whatsappNumber = millWhatsappNumber;
      let email = millEmail;
      let authPersonPhone = authorizedPersonPhone;

      if (!whatsappNumber || !email || !authPersonPhone) {
        const report = await this.prisma.installationReport.findUnique({
          where: { id: reportId },
          select: {
            mill_whatsapp_number: true,
            mill_email: true,
            authorized_person_phone: true,
          },
        });

        if (report) {
          whatsappNumber =
            whatsappNumber || report.mill_whatsapp_number || undefined;
          email = email || report.mill_email || undefined;
          authPersonPhone =
            authPersonPhone || report.authorized_person_phone || undefined;
        }
      }

      if (!whatsappNumber && !email && !authPersonPhone) {
        this.logger.warn(
          `No contact information available for Installation Report ${reportNumber}. Skipping PDF delivery.`,
        );
        return;
      }

      // Send the report
      const result =
        await this.reportNotificationsService.sendInstallationReport(
          reportId,
          millName,
          email,
          whatsappNumber || '',
          authPersonPhone || '',
        );

      if (result.whatsappSent || result.emailSent) {
        this.logger.log(
          `Installation Report ${reportNumber} PDF delivery initiated. ` +
            `WhatsApp: ${result.whatsappSent}, Email: ${result.emailSent}`,
        );
      } else {
        this.logger.error(
          `Failed to deliver Installation Report ${reportNumber} PDF. ` +
            `WhatsApp Error: ${result.whatsappError || 'N/A'}, ` +
            `Email Error: ${result.emailError || 'N/A'}`,
        );
      }
    } catch (error) {
      this.logger.error(
        'Error handling installation-report.created.send-pdf event',
        error,
      );
    }
  }

  /**
   * Handle manual request to send service report PDF
   * This can be triggered from admin dashboard
   */
  @OnEvent('service-report.send-pdf')
  async onServiceReportSendPdf(payload: {
    reportId: string;
    triggeredBy: string;
  }) {
    try {
      const { reportId, triggeredBy } = payload;

      this.logger.log(
        `Manual PDF send requested for Service Report ${reportId} by user ${triggeredBy}`,
      );

      // Fetch report details
      const report = await this.prisma.serviceReport.findUnique({
        where: { id: reportId },
        include: {
          mill: { select: { name: true } },
        },
      });

      if (!report) {
        this.logger.error(`Service Report ${reportId} not found`);
        return;
      }

      const millName = report.mill?.name || 'Unknown Mill';

      const result = await this.reportNotificationsService.sendServiceReport(
        reportId,
        millName,
        report.mill_email,
        report.mill_whatsapp_number,
        report.authorized_person_phone || undefined,
      );

      this.logger.log(
        `Manual Service Report PDF send completed. ` +
          `WhatsApp: ${result.whatsappSent}, Email: ${result.emailSent}`,
      );
    } catch (error) {
      this.logger.error('Error handling service-report.send-pdf event', error);
    }
  }

  /**
   * Handle manual request to send installation report PDF
   * This can be triggered from admin dashboard
   */
  @OnEvent('installation-report.send-pdf')
  async onInstallationReportSendPdf(payload: {
    reportId: string;
    triggeredBy: string;
  }) {
    try {
      const { reportId, triggeredBy } = payload;

      this.logger.log(
        `Manual PDF send requested for Installation Report ${reportId} by user ${triggeredBy}`,
      );

      // Fetch report details
      const report = await this.prisma.installationReport.findUnique({
        where: { id: reportId },
        include: {
          mill: { select: { name: true } },
        },
      });

      if (!report) {
        this.logger.error(`Installation Report ${reportId} not found`);
        return;
      }

      const millName = report.mill?.name || 'Unknown Mill';

      const result =
        await this.reportNotificationsService.sendInstallationReport(
          reportId,
          millName,
          report.mill_email,
          report.mill_whatsapp_number,
          report.authorized_person_phone || undefined,
        );

      this.logger.log(
        `Manual Installation Report PDF send completed. ` +
          `WhatsApp: ${result.whatsappSent}, Email: ${result.emailSent}`,
      );
    } catch (error) {
      this.logger.error(
        'Error handling installation-report.send-pdf event',
        error,
      );
    }
  }
}
