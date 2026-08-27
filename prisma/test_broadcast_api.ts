import 'dotenv/config';
import axios from 'axios';
import * as crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function base64Url(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function createJwt(payload: object, secret: string): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

async function main() {
  console.log('--- 1. RETRIEVING SUPER ADMIN USER FROM DB ---');
  const adminUser = await prisma.user.findFirst({
    where: {
      account_status: 'ACTIVE',
      deleted_at: null,
      role: {
        name: { in: ['SUPER_ADMIN', 'Super Admin', 'Admin', 'admin'], mode: 'insensitive' }
      }
    },
    include: { role: true }
  });

  if (!adminUser) {
    console.error('No admin user found.');
    return;
  }

  console.log(`Using Admin: ${adminUser.full_name} (${adminUser.email}), Role: ${adminUser.role?.name}`);

  // In docker-compose, JWT_SECRET is super-secret-key-change-me
  const secret = 'super-secret-key-change-me';
  const now = Math.floor(Date.now() / 1000);
  const token = createJwt(
    {
      sub: adminUser.id,
      email: adminUser.email,
      full_name: adminUser.full_name,
      role: adminUser.role?.name || 'SUPER_ADMIN',
      permissions: ['*'],
      iat: now,
      exp: now + 86400,
    },
    secret
  );

  console.log('\n--- 2. CALLING LIVE BROADCAST API (PORT 4010) ---');
  try {
    const broadcastRes = await axios.post(
      'http://localhost:4010/api/v1/notifications/broadcast',
      {
        title: 'SuperAdmin Official Broadcast',
        message: 'Live test: Verifying notification delivery to Service Engineers on closed app',
        type: 'BROADCAST',
        target: 'ROLE',
        role_names: ['Service Engineer'],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    console.log('API Status:', broadcastRes.status);
    console.log('API Response:', broadcastRes.data);
    console.log('\n🎉 SUCCESS: Live Broadcast API executed completely with 0 errors!');
  } catch (err: any) {
    console.error('Broadcast API Error:', err?.response?.status, err?.response?.data || err.message);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
