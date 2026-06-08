import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

import IORedis from 'ioredis';

const redisConn = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
});

async function test() {
  try {
    const resets = await prisma.passwordReset.findMany({
      orderBy: { created_at: 'desc' },
      take: 5,
      include: {
        user: {
          select: {
            email: true,
            full_name: true,
          },
        },
      },
    });
    console.log('Latest password resets:', JSON.stringify(resets, null, 2));

    // Get all job keys for 'mail' queue
    const keys = await redisConn.keys('bull:mail:*');
    console.log(`Redis keys count for mail: ${keys.length}`, keys);

    // Fetch the jobs details
    const jobs = [];
    for (const key of keys) {
      if (key.match(/^bull:mail:\d+$/)) {
        const hdata = await redisConn.hgetall(key);
        const jobId = key.split(':').pop();

        // get status
        // BullMQ stores status in separate sets/zsets e.g., bull:mail:wait, bull:mail:completed, bull:mail:failed
        let status = 'unknown';
        if (await redisConn.sismember('bull:mail:completed', jobId!))
          status = 'completed';
        else if (await redisConn.sismember('bull:mail:failed', jobId!))
          status = 'failed';
        else if ((await redisConn.zscore('bull:mail:wait', jobId!)) !== null)
          status = 'waiting';
        else if ((await redisConn.zscore('bull:mail:active', jobId!)) !== null)
          status = 'active';

        const dataParsed = hdata.data ? JSON.parse(hdata.data) : null;
        jobs.push({
          id: jobId,
          to: dataParsed?.to,
          subject: dataParsed?.subject,
          status,
          failedReason: hdata.failedReason,
          finishedOn: hdata.finishedOn,
        });
      }
    }
    console.log('Queue Mail Jobs:', JSON.stringify(jobs, null, 2));
  } catch (error) {
    console.error('Error occurred:', error);
  } finally {
    await prisma.$disconnect();
    redisConn.disconnect();
  }
}

test();
