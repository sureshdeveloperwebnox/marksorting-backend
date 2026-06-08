import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const stores = await prisma.store.findMany({
    select: {
      id: true,
      service_engineer_id: true,
      return_status: true,
      frame_number: true,
      barcode: true,
    },
  });
  console.log('Stores:', JSON.stringify(stores, null, 2));

  await prisma.$disconnect();
  await pool.end();
}

main();
