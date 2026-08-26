import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as admin from 'firebase-admin';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('=== 1. VERIFY FIREBASE CONFIGURATION ===');
  console.log('Project ID:', process.env.FIREBASE_PROJECT_ID);
  console.log('Client Email:', process.env.FIREBASE_CLIENT_EMAIL);
  console.log('Private Key length:', process.env.FIREBASE_PRIVATE_KEY?.length);

  console.log('\n=== 2. VERIFY REGISTERED PUSH TOKENS FOR SERVICE ENGINEERS ===');
  const tokens = await prisma.pushToken.findMany({
    include: {
      user: {
        select: {
          id: true,
          full_name: true,
          email: true,
          phone_number: true,
          role: { select: { name: true } },
        },
      },
    },
  });

  console.log(`Found ${tokens.length} registered push tokens:`);
  for (const t of tokens) {
    console.log(` - User: ${t.user?.full_name} (${t.user?.role?.name}) | Device: ${t.device_type} | Token: ${t.token.substring(0, 20)}...`);
  }

  console.log('\n=== 3. VERIFY TECHNICIAN <-> USER ID RESOLUTION ===');
  const technicians = await prisma.technician.findMany({
    where: { deleted_at: null },
    take: 5,
  });

  for (const tech of technicians) {
    // Attempt match
    const matchedUser = await prisma.user.findFirst({
      where: {
        account_status: 'ACTIVE',
        deleted_at: null,
        OR: [
          { id: tech.id },
          ...(tech.email ? [{ email: tech.email }] : []),
          ...(tech.phone ? [{ phone_number: tech.phone }] : []),
        ],
      },
      select: { id: true, full_name: true, email: true, phone_number: true },
    });
    console.log(`Technician [${tech.full_name}] (Tech ID: ${tech.id}) -> Matched User: ${matchedUser ? `${matchedUser.full_name} (User ID: ${matchedUser.id})` : 'NO USER MATCH'}`);
  }

  console.log('\n=== 4. TEST MULTICAST PUSH NOTIFICATION WITH HIGH IMPORTANCE CHANNEL ===');
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    }

    const validTokens = tokens.map((t) => t.token.trim()).filter(Boolean);
    if (validTokens.length > 0) {
      const response = await admin.messaging().sendEachForMulticast({
        tokens: validTokens,
        notification: {
          title: '⚡ Notification System Verified',
          body: 'Firebase background & high-importance channel notifications are active!',
        },
        data: {
          id: 'test-verification-1',
          recordId: 'test-verification-1',
          type: 'ticket',
          title: '⚡ Notification System Verified',
          body: 'Firebase background & high-importance channel notifications are active!',
          route: '/tickets/test-verification-1',
          screen: 'TicketDetailScreen',
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
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
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
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
                title: '⚡ Notification System Verified',
                body: 'Firebase background & high-importance channel notifications are active!',
              },
              sound: 'default',
              badge: 1,
              contentAvailable: true,
              category: 'FLUTTER_NOTIFICATION_CLICK',
            },
          },
        },
      });

      console.log('FCM Multicast Results:', {
        total: validTokens.length,
        successCount: response.successCount,
        failureCount: response.failureCount,
      });
    }
  }

  console.log('\n=== VERIFICATION COMPLETE ===');
}

main().catch(console.error).finally(() => prisma.$disconnect());
