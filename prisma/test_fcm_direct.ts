import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as admin from 'firebase-admin';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- 1. CHECK FIREBASE ENV VARS ---');
  console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? 'PRESENT (' + process.env.FIREBASE_PROJECT_ID + ')' : 'MISSING');
  console.log('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? 'PRESENT (' + process.env.FIREBASE_CLIENT_EMAIL + ')' : 'MISSING');
  console.log('FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? 'PRESENT (Length: ' + process.env.FIREBASE_PRIVATE_KEY.length + ')' : 'MISSING');

  console.log('\n--- 2. CHECK RECENT NOTIFICATIONS IN DB ---');
  const recentNotifications = await prisma.notification.findMany({
    take: 5,
    orderBy: { created_at: 'desc' },
    include: {
      user: {
        select: { full_name: true, role: { select: { name: true } } }
      }
    }
  });
  console.log(JSON.stringify(recentNotifications, null, 2));

  console.log('\n--- 3. CHECK REGISTERED PUSH TOKENS ---');
  const pushTokens = await prisma.pushToken.findMany({
    include: {
      user: {
        select: { full_name: true, role: { select: { name: true } } }
      }
    }
  });
  console.log(JSON.stringify(pushTokens, null, 2));

  console.log('\n--- 4. TEST DIRECT FIREBASE FCM SEND ---');
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    try {
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          }),
        });
      }
      
      const tokens = pushTokens.map(pt => pt.token.trim());
      if (tokens.length > 0) {
        console.log(`Attempting direct FCM multicast to ${tokens.length} tokens...`);
        const response = await admin.messaging().sendEachForMulticast({
          tokens,
          notification: {
            title: 'Diagnostic Test Push',
            body: 'Direct Firebase FCM verification test',
          },
          data: {
            id: 'test-123',
            type: 'ticket',
            click_action: 'FLUTTER_NOTIFICATION_CLICK',
          },
          android: {
            priority: 'high',
            ttl: 86400 * 1000,
            notification: {
              channelId: 'high_importance_channel',
              sound: 'default',
              priority: 'max',
              visibility: 'public',
            },
          },
        });
        console.log('FCM Multicast Response:', {
          successCount: response.successCount,
          failureCount: response.failureCount,
          responses: response.responses.map((r, i) => ({
            token: tokens[i].substring(0, 15) + '...',
            success: r.success,
            error: r.error ? { code: r.error.code, message: r.error.message } : null,
          })),
        });
      } else {
        console.log('No tokens in DB to send to.');
      }
    } catch (e: any) {
      console.error('Firebase test send error:', e);
    }
  } else {
    console.warn('Cannot test FCM: Missing Firebase env vars');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
