const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});

const connectionString = env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const logs = await prisma.apiLog.findMany({
    where: {
      path: { contains: 'master-mills' },
      method: { in: ['POST', 'PUT', 'DELETE'] }
    },
    orderBy: { created_at: 'desc' },
    take: 10
  });

  console.log("Recent Master Mills API Logs:");
  logs.forEach((log, idx) => {
    console.log(`${idx + 1}. Time: ${log.created_at}, Method: ${log.method}, Path: ${log.path}, Status: ${log.status_code}`);
    console.log("   Req Body:", JSON.stringify(log.request_body));
    console.log("   Res Body:", JSON.stringify(log.response_body));
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
