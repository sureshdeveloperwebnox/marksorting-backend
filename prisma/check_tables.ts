import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const ticketCount = await prisma.supportTicket.count();
    console.log('support_tickets table exists. Count:', ticketCount);
  } catch (error: any) {
    console.error('Error querying support_tickets:', error.message);
  }

  try {
    const settingCount = await prisma.setting.count();
    console.log('settings table exists. Count:', settingCount);
  } catch (error: any) {
    console.error('Error querying settings:', error.message);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
