import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Fetching recent Notification Logs from database...\n');
  const count = await prisma.notificationLog.count();
  console.log(`Total notification logs: ${count}`);

  const logs = await prisma.notificationLog.findMany({
    orderBy: { sent_at: 'desc' },
    take: 50
  });

  console.log('\nRecent notification logs details:');
  logs.forEach(log => {
    console.log(`  - [${log.sent_at?.toISOString() || 'N/A'}] ` +
                `Type: ${log.notification_type}, ` +
                `Channel: ${log.channel}, ` +
                `Status: ${log.status}, ` +
                `Provider Message ID (Report ID): ${log.provider_message_id}, ` +
                `Error: ${log.error_message || 'None'}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
