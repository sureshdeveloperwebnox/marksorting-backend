import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Checking activity logs in database...\n');
  
  const count = await prisma.activityLog.count();
  console.log(`Total activity logs: ${count}`);
  
  if (count > 0) {
    const recent = await prisma.activityLog.findMany({
      take: 10,
      orderBy: { created_at: 'desc' },
      include: { user: { select: { email: true, full_name: true } } }
    });
    
    console.log('\nRecent logs:');
    recent.forEach(log => {
      console.log(`  - [${log.created_at.toISOString()}] ${log.action} ${log.entity_type}: "${log.description}"`);
    });
  } else {
    console.log('\nNo activity logs found in database!');
    console.log('This means the interceptors are not creating logs.');
  }
  
  await prisma.$disconnect();
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
