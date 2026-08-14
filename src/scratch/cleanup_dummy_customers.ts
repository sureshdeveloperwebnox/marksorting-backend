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

  console.log('Cleaning up mills linked to dummy customer matching mill name...');

  const millsWithSameCustomer = await prisma.mill.findMany({
    where: {
      customer_id: { not: null },
      deleted_at: null,
    },
    include: {
      customer: true,
    },
  });

  const dummyMatches = millsWithSameCustomer.filter(
    (m) => m.customer && m.customer.name.trim().toLowerCase() === m.name.trim().toLowerCase(),
  );

  console.log(`Found ${dummyMatches.length} mills linked to dummy customer named after the mill.`);

  for (const m of dummyMatches) {
    if (!m.customer) continue;
    const customerId = m.customer.id;

    // Unlink customer from mill
    await prisma.mill.update({
      where: { id: m.id },
      data: { customer_id: null },
    });

    // Soft delete dummy customer
    try {
      await prisma.customer.update({
        where: { id: customerId },
        data: { deleted_at: new Date() },
      });
      console.log(`Unlinked and soft-deleted dummy customer "${m.customer.name}" for Mill "${m.name}".`);
    } catch (err) {
      console.log(`Unlinked dummy customer "${m.customer.name}" from Mill "${m.name}".`);
    }
  }

  // Flush Redis cache
  try {
    const redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
    });
    await redis.flushdb();
    console.log('Redis cache flushed.');
    redis.disconnect();
  } catch (err) {
    console.log('Redis error:', err);
  }
}

main().catch(console.error);
