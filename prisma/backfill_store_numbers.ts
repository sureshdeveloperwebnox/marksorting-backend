import * as dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting store_number backfill for existing store records...');

  const stores = await prisma.store.findMany({
    orderBy: { created_at: 'asc' },
    select: { id: true, created_at: true, store_number: true },
  });

  console.log(`Found ${stores.length} store records in database.`);

  const dayMap = new Map<string, number>();

  let updatedCount = 0;

  for (const s of stores) {
    const d = new Date(s.created_at || new Date());
    const dateStr = d.toISOString().slice(0, 10).replace(/-/g, '');
    const currentSeq = (dayMap.get(dateStr) || 0) + 1;
    dayMap.set(dateStr, currentSeq);

    const generatedNumber = `ST-${dateStr}-${currentSeq}`;

    if (!s.store_number) {
      await prisma.store.update({
        where: { id: s.id },
        data: { store_number: generatedNumber },
      });
      updatedCount++;
    }
  }

  console.log(`Successfully backfilled ${updatedCount} store records with unique store_numbers!`);
}

main()
  .catch((e) => {
    console.error('Error during backfill:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
