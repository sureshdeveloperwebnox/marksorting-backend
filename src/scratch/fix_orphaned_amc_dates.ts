import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('Cleaning up orphaned AMC closing dates in database...');
  const result = await prisma.masterMill.updateMany({
    where: {
      amc_starting_date: null,
    },
    data: {
      amc_closing_date: null,
    },
  });
  console.log(`Successfully updated ${result.count} MasterMill records.`);
}

main().catch(console.error);
