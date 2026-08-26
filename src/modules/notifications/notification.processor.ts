import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

function mapNotificationType(type: string): string {
  const upper = String(type || '').toUpperCase();
  switch (upper) {
    case 'TICKET':
      return 'ticket';
    case 'EXPENSE':
      return 'expense';
    case 'STORE':
    case 'STORE_RETURN':
      return 'store_return';
    case 'INSTALLATION':
    case 'INSTALLATION_REPORT':
      return 'installation_report';
    case 'SERVICE_REPORT':
      return 'service_report';
    default:
      return String(type || '').toLowerCase();
  }
}

@Processor('notifications')
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);
  private firebaseApp: any = null;
  private firebaseInitialized = false;
  private firebaseMockMode = false;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super();
  }

  private initFirebase() {
    if (this.firebaseInitialized) return;

    const projectId = this.configService.get<string>('firebase.projectId');
    const clientEmail = this.configService.get<string>('firebase.clientEmail');
    const rawPrivateKey = this.configService.get<string>('firebase.privateKey');

    if (!projectId || !clientEmail || !rawPrivateKey) {
      this.logger.warn(
        'Firebase credentials not provided. Running in Mock Mode for push notifications.',
      );
      this.firebaseMockMode = true;
      this.firebaseInitialized = true;
      return;
    }

    try {
      const admin = require('firebase-admin');
      if (!admin.apps.length) {
        // Robust formatting: handle quotes, literal \n, and windows \r\n
        const formattedKey = rawPrivateKey
          .replace(/^["']|["']$/g, '')
          .replace(/\\n/g, '\n')
          .replace(/\r\n/g, '\n')
          .trim();

        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: projectId.trim(),
            clientEmail: clientEmail.trim(),
            privateKey: formattedKey,
          }),
        });
      }
      this.firebaseApp = admin;
      this.firebaseMockMode = false;
      this.logger.log('Firebase Admin SDK initialized successfully.');
    } catch (err) {
      this.logger.error('Failed to initialize Firebase Admin SDK', err);
      this.firebaseMockMode = true;
    }

    this.firebaseInitialized = true;
  }

  async process(job: Job<any>) {
    if (job.name === 'send-push') {
      await this.sendPush(job.data);
    }
  }

  async sendPush(data: {
    id?: string;
    userId: string;
    title: string;
    message: string;
    type: any;
    recordId?: string;
    metaData?: Record<string, any>;
  }) {
    this.initFirebase();
    const { id, userId, title, message, type, recordId } = data;
    const targetRecordId =
      recordId ||
      data.metaData?.reportId ||
      data.metaData?.expenseId ||
      data.metaData?.ticketId ||
      data.metaData?.storeId ||
      data.metaData?.id ||
      id ||
      '';
    const mappedType = mapNotificationType(type);

    if (this.firebaseMockMode) {
      this.logger.log(
        `[Mock FCM] Would send push to user ${userId}: "${title}" - "${message}" (type: ${mappedType}, id: ${targetRecordId})`,
      );
      return {
        success: true,
        mockMode: true,
        message: 'Running in Firebase Mock Mode (credentials not provided)',
      };
    }

    const pushTokens = await this.prisma.pushToken.findMany({
      where: { user_id: userId },
      select: { token: true },
      orderBy: { updated_at: 'desc' },
    });

    if (!pushTokens.length) {
      this.logger.warn(`No push tokens found in database for user ${userId}`);
      return {
        success: false,
        tokensCount: 0,
        message: `No active FCM push tokens found for user ${userId}`,
      };
    }

    const tokens = Array.from(
      new Set(pushTokens.map((pt) => pt.token.trim())),
    ).filter(Boolean);

    if (!tokens.length) {
      return {
        success: false,
        tokensCount: 0,
        message: 'Push tokens array was empty after cleaning',
      };
    }

    const targetRoute =
      data.metaData?.route ||
      (mappedType === 'ticket'
        ? `/tickets/${targetRecordId}`
        : mappedType === 'service_report'
          ? `/service-reports/${targetRecordId}`
          : mappedType === 'installation_report'
            ? `/installation-reports/${targetRecordId}`
            : mappedType === 'expense'
              ? `/expenses/${targetRecordId}`
              : mappedType === 'store_return' || mappedType === 'store'
                ? `/stores/${targetRecordId}`
                : '/notifications');

    const targetScreen =
      data.metaData?.screen ||
      (mappedType === 'ticket'
        ? 'TicketDetailScreen'
        : mappedType === 'service_report'
          ? 'ServiceReportDetailScreen'
          : mappedType === 'installation_report'
            ? 'InstallationReportDetailScreen'
            : mappedType === 'expense'
              ? 'ExpenseDetailScreen'
              : mappedType === 'store_return' || mappedType === 'store'
                ? 'StoreDetailScreen'
                : 'NotificationsScreen');

    try {
      const response = await this.firebaseApp.messaging().sendEachForMulticast({
        tokens,
        notification: {
          title,
          body: message,
        },
        data: {
          id: String(targetRecordId || ''),
          recordId: String(targetRecordId || ''),
          notificationId: String(id || ''),
          type: mappedType,
          notificationType: String(type || ''),
          title: String(title || ''),
          body: String(message || ''),
          message: String(message || ''),
          route: String(targetRoute),
          screen: String(targetScreen),
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
          ...(data.metaData
            ? Object.fromEntries(
                Object.entries(data.metaData).map(([k, v]) => [
                  k,
                  typeof v === 'object' && v !== null
                    ? JSON.stringify(v)
                    : String(v ?? ''),
                ]),
              )
            : {}),
        },
        android: {
          priority: 'high',
          ttl: 86400 * 1000,
          notification: {
            sound: 'default',
            defaultSound: true,
            defaultVibrateTimings: true,
            priority: 'high',
            visibility: 'public',
            tag: String(targetRecordId || mappedType),
          },
        },
        apns: {
          headers: {
            'apns-priority': '10',
            'apns-push-type': 'alert',
          },
          payload: {
            aps: {
              alert: {
                title,
                body: message,
              },
              sound: 'default',
              badge: 1,
              contentAvailable: true,
            },
          },
        },
      });

      this.logger.log(
        `Successfully sent FCM push to user ${userId} with ${tokens.length} tokens. Success count: ${response.successCount}, Failure count: ${response.failureCount}`,
      );

      const failed = response.responses
        .map((r: any, i: number) => {
          if (!r.success) {
            const errCode = r.error?.code || '';
            if (
              errCode.includes('invalid-registration-token') ||
              errCode.includes('registration-token-not-registered') ||
              errCode.includes('invalid-argument') ||
              !errCode
            ) {
              return tokens[i];
            }
          }
          return null;
        })
        .filter(Boolean);

      if (failed.length > 0) {
        await this.prisma.pushToken.deleteMany({
          where: { token: { in: failed } },
        });
        this.logger.warn(`Removed ${failed.length} invalid FCM tokens.`);
      }

      return {
        success: response.successCount > 0,
        tokensCount: tokens.length,
        successCount: response.successCount,
        failureCount: response.failureCount,
        responses: response.responses.map((r: any) => ({
          success: r.success,
          messageId: r.messageId,
          error: r.error ? { code: r.error.code, message: r.error.message } : null,
        })),
      };
    } catch (err: any) {
      this.logger.error(`Failed to send FCM push for user ${userId}`, err);
      return {
        success: false,
        error: err.message,
      };
    }
  }
}
