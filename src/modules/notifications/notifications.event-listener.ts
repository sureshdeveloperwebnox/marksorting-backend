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
    reportId?: string;
    reportNumber: string;
    millName: string;
    technicianUserIds: string[];
    creatorUserId?: string;
  }) {
    try {
      const {
        reportId,
        reportNumber,
        millName,
        technicianUserIds,
        creatorUserId,
      } = payload;
      const title = 'New Service Report Created';
      const message = `Service Report ${reportNumber} has been created for mill "${millName}".`;

      await this.notificationsService.notifyStakeholders(
        technicianUserIds,
        creatorUserId,
        title,
        message,
        NotificationType.SERVICE_REPORT,
        { reportId, reportNumber, millName },
      );
    } catch (err) {
      this.logger.error('Error handling service-report.created event', err);
    }
  }

  @OnEvent('installation-report.created')
  async onInstallationReportCreated(payload: {
    reportId?: string;
    reportNumber: string;
    millName: string;
    technicianUserIds: string[];
    creatorUserId?: string;
  }) {
    try {
      const {
        reportId,
        reportNumber,
        millName,
        technicianUserIds,
        creatorUserId,
      } = payload;
      const title = 'New Installation Report Created';
      const message = `Installation Report ${reportNumber} has been created for mill "${millName}".`;

      await this.notificationsService.notifyStakeholders(
        technicianUserIds,
        creatorUserId,
        title,
        message,
        NotificationType.INSTALLATION,
        { reportId, reportNumber, millName },
      );
    } catch (err) {
      this.logger.error(
        'Error handling installation-report.created event',
        err,
      );
    }
  }

  @OnEvent('expense.created')
  async onExpenseCreated(payload: {
    expenseId?: string;
    expenseNumber: string;
    amount: string;
    creatorUserId?: string;
    technicianUserIds?: string[];
  }) {
    try {
      const {
        expenseId,
        expenseNumber,
        amount,
        creatorUserId,
        technicianUserIds,
      } = payload;
      const title = 'New Expense Submitted';
      const message = `Expense ${expenseNumber} of ₹${amount} has been submitted for approval.`;

      await this.notificationsService.notifyStakeholders(
        technicianUserIds || [],
        creatorUserId,
        title,
        message,
        NotificationType.EXPENSE,
        { expenseId, expenseNumber, amount },
      );
    } catch (err) {
      this.logger.error('Error handling expense.created event', err);
    }
  }

  @OnEvent('expense.status_updated')
  async onExpenseStatusUpdated(payload: {
    expenseId?: string;
    expenseNumber: string;
    status: string;
    technicianUserIds: string[];
  }) {
    try {
      const { expenseId, expenseNumber, status, technicianUserIds } = payload;
      const statusLabel =
        status === 'COMPLETED'
          ? 'approved'
          : status === 'CANCELLED'
            ? 'rejected'
            : status.toLowerCase();
      const title = 'Expense Status Updated';
      const message = `Your expense ${expenseNumber} has been ${statusLabel}.`;

      await this.notificationsService.sendToUsers(
        technicianUserIds,
        title,
        message,
        NotificationType.EXPENSE,
        { expenseId, expenseNumber, status },
      );
    } catch (err) {
      this.logger.error('Error handling expense.status_updated event', err);
    }
  }

  @OnEvent('ticket.created')
  async onTicketCreated(payload: {
    ticketId?: string;
    ticketNumber: string;
    subject: string;
    assignedTechnicianUserIds: string[];
    creatorUserId?: string;
  }) {
    try {
      const {
        ticketId,
        ticketNumber,
        subject,
        assignedTechnicianUserIds,
        creatorUserId,
      } = payload;
      const title = 'New Support Ticket Created';
      const message = `Ticket ${ticketNumber}: "${subject}" has been created.`;

      await this.notificationsService.notifyStakeholders(
        assignedTechnicianUserIds,
        creatorUserId,
        title,
        message,
        NotificationType.TICKET,
        { ticketId, ticketNumber, subject },
      );
    } catch (err) {
      this.logger.error('Error handling ticket.created event', err);
    }
  }

  @OnEvent('ticket.assigned')
  async onTicketAssigned(payload: {
    ticketId?: string;
    ticketNumber: string;
    subject: string;
    assignedTechnicianUserIds: string[];
  }) {
    try {
      const {
        ticketId,
        ticketNumber,
        subject,
        assignedTechnicianUserIds,
      } = payload;
      const title = 'Ticket Assigned to You';
      const message = `You have been assigned to Ticket ${ticketNumber}: "${subject}".`;

      await this.notificationsService.sendToUsers(
        assignedTechnicianUserIds,
        title,
        message,
        NotificationType.TICKET,
        { ticketId, ticketNumber, subject },
      );
    } catch (err) {
      this.logger.error('Error handling ticket.assigned event', err);
    }
  }

  @OnEvent('store.created')
  async onStoreCreated(payload: {
    storeId: string;
    storeNumber?: string;
    frameNumber?: string;
    technicianUserId?: string;
    creatorUserId?: string;
    inflowStatus?: string;
    quantity?: number;
  }) {
    try {
      const {
        storeId,
        storeNumber,
        frameNumber,
        technicianUserId,
        creatorUserId,
        inflowStatus,
      } = payload;
      const title = 'New Store Record Created';
      const label =
        storeNumber || (frameNumber ? `Frame ${frameNumber}` : 'Store Record');
      const message = `A new store record (${inflowStatus || 'Inflow'}) for ${label} has been created.`;

      const technicianIds = technicianUserId ? [technicianUserId] : [];
      await this.notificationsService.notifyStakeholders(
        technicianIds,
        creatorUserId,
        title,
        message,
        NotificationType.STORE,
        { storeId, storeNumber, frameNumber, inflowStatus },
      );
    } catch (err) {
      this.logger.error('Error handling store.created event', err);
    }
  }

  @OnEvent('store.return_updated')
  async onStoreReturnUpdated(payload: {
    storeId: string;
    storeNumber?: string;
    frameNumber?: string;
    returnStatus: string;
    technicianUserId?: string;
    creatorUserId?: string;
  }) {
    try {
      const {
        storeId,
        storeNumber,
        frameNumber,
        returnStatus,
        technicianUserId,
        creatorUserId,
      } = payload;
      const title = 'Store Return Status Updated';
      const label =
        storeNumber ||
        (frameNumber ? `machine ${frameNumber}` : 'store return');
      const message = `Store return for ${label} has been updated to "${returnStatus}".`;

      const technicianIds = technicianUserId ? [technicianUserId] : [];
      await this.notificationsService.notifyStakeholders(
        technicianIds,
        creatorUserId,
        title,
        message,
        NotificationType.STORE,
        { storeId, storeNumber, returnStatus, frameNumber },
      );
    } catch (err) {
      this.logger.error('Error handling store.return_updated event', err);
    }
  }
}
