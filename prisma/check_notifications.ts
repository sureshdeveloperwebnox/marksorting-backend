import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const tokens = await prisma.pushToken.findMany({
    select: {
      id: true,
      user_id: true,
      token: true,
      device_type: true,
      created_at: true,
      user: {
        select: {
          full_name: true,
          role: {
            select: {
              name: true,
            }
          }
        }
      }
    }
  });
  console.log('PUSH TOKENS IN DB:', JSON.stringify(tokens, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
