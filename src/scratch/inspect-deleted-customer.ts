import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const customerId = '0194f068-4a53-4118-9129-d3f8e96b8f02';
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  });
  console.log('CUSTOMER DIRECT QUERY RESULT:', customer);

  const allCustomers = await prisma.customer.findMany();
  console.log(
    'ALL CUSTOMERS (INCL DELETED):',
    allCustomers.map((c) => ({
      id: c.id,
      name: c.name,
      deleted_at: c.deleted_at,
    })),
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
