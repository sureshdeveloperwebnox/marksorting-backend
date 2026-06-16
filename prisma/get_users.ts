
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      full_name: true,
      role: {
        select: {
          name: true,
        }
      }
    }
  });
  console.log('USERS IN SYSTEM:', JSON.stringify(users, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
