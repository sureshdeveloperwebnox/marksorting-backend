import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany({
    where: { deleted_at: null },
    select: {
      id: true,
      email: true,
      full_name: true,
      account_status: true,
      role: { select: { name: true } }
    },
    take: 10,
    orderBy: { created_at: 'asc' }
  });
  console.log('Admin users:');
  console.table(users);
}

main().catch(console.error).finally(() => prisma.$disconnect());
