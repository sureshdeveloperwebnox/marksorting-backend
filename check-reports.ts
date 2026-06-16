import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// Manual env parsing since we might not have dotenv on path
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const index = trimmed.indexOf('=');
      if (index > 0) {
        const key = trimmed.slice(0, index).trim();
        let val = trimmed.slice(index + 1).trim();
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  }
}

async function main() {
  loadEnv();
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const reports = await prisma.serviceReport.findMany({
      select: {
        id: true,
        report_number: true,
        visit_date: true,
        visit_time: true,
        created_at: true,
        deleted_at: true,
      },
      take: 10,
    });
    console.log('--- Database Reports ---');
    console.log(JSON.stringify(reports, null, 2));
  } catch (error) {
    console.error('Error querying reports:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
