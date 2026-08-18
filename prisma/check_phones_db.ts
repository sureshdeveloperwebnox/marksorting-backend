import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const millPhones = await prisma.mill.findMany({
    select: { phone: true },
    distinct: ['phone'],
    where: { phone: { not: null } }
  });
  console.log('Distinct mill phones count:', millPhones.length);
  console.log('Distinct mill phones:', millPhones.map(m => m.phone));
}

main().catch(console.error).finally(() => prisma.$disconnect());
