const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

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
      console.log(`  - ${log.action} ${log.entity_type}: "${log.description}" by ${log.user?.email || 'unknown'}`);
    });
  } else {
    console.log('\nNo activity logs found in database!');
  }
  
  await prisma.$disconnect();
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
