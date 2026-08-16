import { NotificationsService } from './notifications.service';
export declare class NotificationsEventListener {
    private notificationsService;
    private readonly logger;
    constructor(notificationsService: NotificationsService);
    onServiceReportCreated(payload: {
        reportNumber: string;
        millName: string;
        technicianUserIds: string[];
        creatorUserId?: string;
    }): Promise<void>;
    onInstallationReportCreated(payload: {
        reportNumber: string;
        millName: string;
        technicianUserIds: string[];
        creatorUserId?: string;
    }): Promise<void>;
    onExpenseCreated(payload: {
        expenseNumber: string;
        amount: string;
        creatorUserId?: string;
        technicianUserIds?: string[];
    }): Promise<void>;
    onExpenseStatusUpdated(payload: {
        expenseNumber: string;
        status: string;
        technicianUserIds: string[];
    }): Promise<void>;
    onTicketCreated(payload: {
        ticketNumber: string;
        subject: string;
        assignedTechnicianUserIds: string[];
        creatorUserId?: string;
    }): Promise<void>;
    onTicketAssigned(payload: {
        ticketNumber: string;
        subject: string;
        assignedTechnicianUserIds: string[];
    }): Promise<void>;
}
