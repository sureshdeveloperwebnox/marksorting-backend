import { PrismaService } from './prisma/prisma.service';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  const prisma = new PrismaService();
  await prisma.$connect();
  
  // Find dummy test records
  const testMills = await prisma.mill.findMany({
    where: {
      name: { startsWith: 'Mill Test' },
    },
    select: { id: true, name: true },
  });
  console.log('Found dummy test mills:', testMills.length);

  const deletedMM = await prisma.masterMill.deleteMany({
    where: {
      OR: [
        { ref_no: { in: Array.from({ length: 35 }, (_, i) => `REF-001${11 + i}`) }, mill: { name: { startsWith: 'Mill Test' } } },
        { mill_id: { in: testMills.map(m => m.id) } },
      ],
    },
  });
  console.log('Deleted dummy MasterMill records:', deletedMM.count);

  const deletedMills = await prisma.mill.deleteMany({
    where: {
      id: { in: testMills.map(m => m.id) },
    },
  });
  console.log('Deleted dummy Mill records:', deletedMills.count);

  const deletedCustomers = await prisma.customer.deleteMany({
    where: {
      name: { startsWith: 'Customer 11' },
    },
  });
  console.log('Deleted dummy Customer records:', deletedCustomers.count);

  await prisma.$disconnect();
}

main().catch(console.error);
