import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from './notifications.service';
import { NotificationType } from './dto/broadcast-notification.dto';

@Injectable()
export class NotificationsEventListener {
  private readonly logger = new Logger(NotificationsEventListener.name);

  constructor(private notificationsService: NotificationsService) {}

  @OnEvent('service-report.created')
  async onServiceReportCreated(payload: {
    reportNumber: string;
    millName: string;
    technicianUserIds: string[];
    creatorUserId?: string;
  }) {
    try {
      const { reportNumber, millName, technicianUserIds, creatorUserId } = payload;
      const title = 'New Service Report Created';
      const message = `Service Report ${reportNumber} has been created for mill "${millName}".`;

      const adminIds = await this.notificationsService.getAdminUserIds();
      const recipientIds = new Set([...adminIds, ...technicianUserIds]);
      if (creatorUserId) recipientIds.delete(creatorUserId);

      await this.notificationsService.sendToUsers(
        Array.from(recipientIds),
        title,
        message,
        NotificationType.SERVICE_REPORT,
        { reportNumber, millName },
      );
    } catch (err) {
      this.logger.error('Error handling service-report.created event', err);
    }
  }

  @OnEvent('installation-report.created')
  async onInstallationReportCreated(payload: {
    reportNumber: string;
    millName: string;
    technicianUserIds: string[];
    creatorUserId?: string;
  }) {
    try {
      const { reportNumber, millName, technicianUserIds, creatorUserId } = payload;
      const title = 'New Installation Report Created';
      const message = `Installation Report ${reportNumber} has been created for mill "${millName}".`;

      const adminIds = await this.notificationsService.getAdminUserIds();
      const recipientIds = new Set([...adminIds, ...technicianUserIds]);
      if (creatorUserId) recipientIds.delete(creatorUserId);

      await this.notificationsService.sendToUsers(
        Array.from(recipientIds),
        title,
        message,
        NotificationType.INSTALLATION,
        { reportNumber, millName },
      );
    } catch (err) {
      this.logger.error('Error handling installation-report.created event', err);
    }
  }

  @OnEvent('expense.created')
  async onExpenseCreated(payload: {
    expenseNumber: string;
    amount: string;
    creatorUserId?: string;
    technicianUserIds?: string[];
  }) {
    try {
      const { expenseNumber, amount, creatorUserId } = payload;
      const title = 'New Expense Submitted';
      const message = `Expense ${expenseNumber} of ₹${amount} has been submitted for approval.`;

      const adminIds = await this.notificationsService.getAdminUserIds();
      const recipientIds = adminIds.filter((id) => id !== creatorUserId);

      await this.notificationsService.sendToUsers(
        recipientIds,
        title,
        message,
        NotificationType.EXPENSE,
        { expenseNumber, amount },
      );
    } catch (err) {
      this.logger.error('Error handling expense.created event', err);
    }
  }

  @OnEvent('expense.status_updated')
  async onExpenseStatusUpdated(payload: {
    expenseNumber: string;
    status: string;
    technicianUserIds: string[];
  }) {
    try {
      const { expenseNumber, status, technicianUserIds } = payload;
      const statusLabel = status === 'COMPLETED' ? 'approved' : status.toLowerCase();
      const title = 'Expense Status Updated';
      const message = `Your expense ${expenseNumber} has been ${statusLabel}.`;

      await this.notificationsService.sendToUsers(
        technicianUserIds,
        title,
        message,
        NotificationType.EXPENSE,
        { expenseNumber, status },
      );
    } catch (err) {
      this.logger.error('Error handling expense.status_updated event', err);
    }
  }

  @OnEvent('ticket.created')
  async onTicketCreated(payload: {
    ticketNumber: string;
    subject: string;
    assignedTechnicianUserIds: string[];
    creatorUserId?: string;
  }) {
    try {
      const { ticketNumber, subject, assignedTechnicianUserIds, creatorUserId } = payload;
      const title = 'New Support Ticket Created';
      const message = `Ticket ${ticketNumber}: "${subject}" has been created.`;

      const adminIds = await this.notificationsService.getAdminUserIds();
      const recipientIds = new Set([...adminIds, ...assignedTechnicianUserIds]);
      if (creatorUserId) recipientIds.delete(creatorUserId);

      await this.notificationsService.sendToUsers(
        Array.from(recipientIds),
        title,
        message,
        NotificationType.TICKET,
        { ticketNumber, subject },
      );
    } catch (err) {
      this.logger.error('Error handling ticket.created event', err);
    }
  }

  @OnEvent('ticket.assigned')
  async onTicketAssigned(payload: {
    ticketNumber: string;
    subject: string;
    assignedTechnicianUserIds: string[];
  }) {
    try {
      const { ticketNumber, subject, assignedTechnicianUserIds } = payload;
      const title = 'Ticket Assigned to You';
      const message = `You have been assigned to Ticket ${ticketNumber}: "${subject}".`;

      await this.notificationsService.sendToUsers(
        assignedTechnicianUserIds,
        title,
        message,
        NotificationType.TICKET,
        { ticketNumber, subject },
      );
    } catch (err) {
      this.logger.error('Error handling ticket.assigned event', err);
    }
  }
}
