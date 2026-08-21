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
    const privateKey = this.configService.get<string>('firebase.privateKey');

    if (!projectId || !clientEmail || !privateKey) {
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
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'),
          }),
        });
      }
      this.firebaseApp = admin;
      this.logger.log('Firebase Admin SDK initialized successfully.');
    } catch (err) {
      this.logger.error('Failed to initialize Firebase Admin SDK', err);
      this.firebaseMockMode = true;
    }

    this.firebaseInitialized = true;
  }

  async process(job: Job<any>) {
    if (job.name === 'send-push') {
      await this.handleSendPush(job);
    }
  }

  private async handleSendPush(job: Job<any>) {
    this.initFirebase();
    const { id, userId, title, message, type, recordId } = job.data;
    const targetRecordId =
      recordId ||
      job.data.metaData?.reportId ||
      job.data.metaData?.expenseId ||
      job.data.metaData?.ticketId ||
      job.data.metaData?.storeId ||
      job.data.metaData?.id ||
      id ||
      '';
    const mappedType = mapNotificationType(type);

    if (this.firebaseMockMode) {
      this.logger.log(
        `[Mock FCM] Would send push to user ${userId}: "${title}" - "${message}" (type: ${mappedType}, id: ${targetRecordId})`,
      );
      return;
    }

    const pushTokens = await this.prisma.pushToken.findMany({
      where: { user_id: userId },
      select: { token: true },
      orderBy: { updated_at: 'desc' },
    });

    if (!pushTokens.length) return;

    const tokens = Array.from(
      new Set(pushTokens.map((pt) => pt.token.trim())),
    ).filter(Boolean);

    if (!tokens.length) return;

    try {
      const response = await this.firebaseApp.messaging().sendEachForMulticast({
        tokens,
        notification: {
          title,
          body: message,
        },
        data: {
          id: String(targetRecordId || ''),
          type: mappedType,
          title: String(title || ''),
          body: String(message || ''),
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
          ...(job.data.metaData
            ? Object.fromEntries(
                Object.entries(job.data.metaData).map(([k, v]) => [
                  k,
                  String(v ?? ''),
                ]),
              )
            : {}),
        },
        android: {
          priority: 'high',
          ttl: 86400 * 1000,
          notification: {
            channelId: 'high_importance_channel',
            icon: '@mipmap/launcher_icon',
            sound: 'default',
            defaultSound: true,
            defaultVibrateTimings: true,
            priority: 'max',
            visibility: 'public',
          },
        },
        apns: {
          headers: {
            'apns-priority': '10',
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
            const errCode = r.error?.code;
            if (
              errCode === 'messaging/invalid-registration-token' ||
              errCode === 'messaging/registration-token-not-registered' ||
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
    } catch (err) {
      this.logger.error(`Failed to send FCM push for user ${userId}`, err);
      throw err;
    }
  }
}
