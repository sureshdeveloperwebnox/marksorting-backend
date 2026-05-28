import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

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
    const { userId, title, message } = job.data;

    if (this.firebaseMockMode) {
      this.logger.log(
        `[Mock FCM] Would send push to user ${userId}: "${title}" - "${message}"`,
      );
      return;
    }

    const pushTokens = await this.prisma.pushToken.findMany({
      where: { user_id: userId },
      select: { token: true },
    });

    if (!pushTokens.length) return;

    const tokens = pushTokens.map((pt) => pt.token);

    try {
      const response = await this.firebaseApp.messaging().sendEachForMulticast({
        tokens,
        notification: { title, body: message },
        data: job.data.metaData
          ? Object.fromEntries(
              Object.entries(job.data.metaData).map(([k, v]) => [k, String(v)]),
            )
          : {},
      });

      const failed = response.responses
        .map((r: any, i: number) => (!r.success ? tokens[i] : null))
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
