import 'dotenv/config';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import IORedis from 'ioredis';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const redisConn = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
});

async function runTest() {
  const email = 'kator18328@mtupu.com';
  const backendUrl = 'http://localhost:4000/api/v1';

  console.log(`Starting password reset end-to-end test for ${email}...`);

  try {
    // 1. Get initial password hash
    const userBefore = await prisma.user.findUnique({ where: { email } });
    if (!userBefore) {
      console.error(`User ${email} not found in database!`);
      return;
    }
    const oldHash = userBefore.password_hash;
    console.log('Initial password hash:', oldHash);

    // 2. Call forgot-password
    console.log('1. Calling forgot-password endpoint...');
    const forgotRes = await axios.post(`${backendUrl}/auth/forgot-password`, { email });
    console.log('Forgot password response:', forgotRes.data);

    // Wait a brief moment for the job to be placed in Redis queue
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // 3. Connect to Redis and get the latest job from the 'mail' queue
    console.log('2. Querying Redis for queued mail job...');
    const jobKeys = await redisConn.keys('bull:mail:*');
    console.log(`Found ${jobKeys.length} keys in Redis for mail queue.`);

    // Let's query jobs using redis keys or scans
    // BullMQ stores jobs under hash keys: bull:mail:<id>
    let rawToken: string | null = null;
    
    for (const key of jobKeys) {
      if (key.match(/^bull:mail:\d+$/)) {
        const jobData = await redisConn.hgetall(key);
        if (jobData && jobData.data) {
          const parsed = JSON.parse(jobData.data);
          if (parsed.to === email) {
            console.log('Found mail job for user. Subject:', parsed.subject);
            // Extract the token using regex from html or resetUrl
            const match = parsed.html.match(/token=([a-f0-9]+)/);
            if (match) {
              rawToken = match[1];
              console.log('Extracted raw token from email HTML:', rawToken);
              break;
            }
          }
        }
      }
    }

    if (!rawToken) {
      console.error('Could not find queued mail job or extract token!');
      return;
    }

    // 4. Call reset-password using the raw token
    console.log('3. Calling reset-password endpoint...');
    const resetRes = await axios.post(`${backendUrl}/auth/reset-password`, {
      token: rawToken,
      password: 'NewVetri@123',
    });
    console.log('Reset password response:', resetRes.data);

    // 5. Verify password hash updated in DB
    const userAfter = await prisma.user.findUnique({ where: { email } });
    const newHash = userAfter?.password_hash;
    console.log('New password hash:', newHash);

    if (newHash !== oldHash) {
      console.log('SUCCESS: Password hash changed in database!');
    } else {
      console.error('FAILURE: Password hash in database remains unchanged!');
    }

  } catch (error: any) {
    console.error('Error during test:', error.response?.data || error.message);
  } finally {
    await prisma.$disconnect();
    redisConn.disconnect();
  }
}

runTest();
