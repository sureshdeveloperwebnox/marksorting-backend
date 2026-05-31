import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import IORedis from 'ioredis';
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const redisConn = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
});

async function main() {
  const email = 'kator18328@mtupu.com';
  try {
    // 1. Get user details from DB
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log(`User ${email} not found.`);
      return;
    }
    console.log('User ID:', user.id);
    console.log('Password hash in DB:', user.password_hash);

    // 2. Clear cache keys in Redis
    const keysToDelete = [
      `user:email:${email}`,
      `user:id:${user.id}`,
      `users:email:${email}`,
      `user_permissions:${user.id}`
    ];
    for (const key of keysToDelete) {
      const deleted = await redisConn.del(key);
      console.log(`Deleted Redis key ${key}: ${deleted}`);
    }

    // 3. Test candidates against the DB hash
    const candidates = ['Vetri@123', 'NewVetri@123', 'admin123', 'vetri@123'];
    for (const cand of candidates) {
      const match = await bcrypt.compare(cand, user.password_hash);
      console.log(`Candidate "${cand}" vs DB hash: ${match ? 'MATCHES' : 'does NOT match'}`);
    }

  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
    redisConn.disconnect();
  }
}

main();
