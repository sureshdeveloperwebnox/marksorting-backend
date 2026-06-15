import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const search = 'P-00988';
  const orConditions: any[] = [
    { invoice_no: { contains: search, mode: 'insensitive' } },
    { ref_no: { contains: search, mode: 'insensitive' } },
    { mc_model: { contains: search, mode: 'insensitive' } },
    { frame_no: { contains: search, mode: 'insensitive' } },
    { place: { contains: search, mode: 'insensitive' } },
    { address: { contains: search, mode: 'insensitive' } },
    { mill: { name: { contains: search, mode: 'insensitive' } } },
  ];

  const results = await prisma.masterMill.findMany({
    where: {
      OR: orConditions,
      status: 'ACTIVE',
      deleted_at: null
    },
    include: {
      mill: true
    }
  });

  console.log('RESULTS FOR P-00988:', JSON.stringify(results, null, 2));

  // Let's also check with mill.ref_no search included
  const orConditionsWithMillRef: any[] = [
    ...orConditions,
    { mill: { ref_no: { contains: search, mode: 'insensitive' } } }
  ];

  const resultsWithMillRef = await prisma.masterMill.findMany({
    where: {
      OR: orConditionsWithMillRef,
      status: 'ACTIVE',
      deleted_at: null
    },
    include: {
      mill: true
    }
  });

  console.log('RESULTS WITH MILL REF NO SEARCH:', JSON.stringify(resultsWithMillRef, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
