import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const masterMills = await prisma.masterMill.findMany({
    include: {
      mill: true
    }
  });
  console.log('MASTER MILLS:', JSON.stringify(masterMills, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
