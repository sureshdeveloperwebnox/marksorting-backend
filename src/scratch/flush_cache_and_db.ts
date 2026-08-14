import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import Redis from 'ioredis';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('1. Cleaning DB records...');
  const res1 = await prisma.masterMill.updateMany({
    where: { amc_starting_date: null },
    data: { amc_closing_date: null },
  });
  console.log(`Updated ${res1.count} records without amc_starting_date.`);

  console.log('2. Flushing Redis cache...');
  try {
    const redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
    });
    await redis.flushdb();
    console.log('Redis cache flushed successfully.');
    redis.disconnect();
  } catch (err) {
    console.log('Redis flush warning:', err);
  }
}

main().catch(console.error);
