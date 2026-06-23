const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

// Parse .env manually
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
  const serviceCount = await prisma.serviceReport.count({ where: { deleted_at: null } });
  const installationCount = await prisma.installationReport.count({ where: { deleted_at: null } });
  
  console.log("Service Reports count:", serviceCount);
  console.log("Installation Reports count:", installationCount);

  const latestService = await prisma.serviceReport.findMany({
    orderBy: { created_at: 'desc' },
    take: 5,
    include: { mill: true }
  });
  console.log("Latest Service Reports:");
  latestService.forEach(r => {
    console.log(`- ID: ${r.id}, No: ${r.report_number}, Mill: ${r.mill ? r.mill.name : 'None'}, Date: ${r.visit_date}`);
  });

  const latestInstallation = await prisma.installationReport.findMany({
    orderBy: { created_at: 'desc' },
    take: 5,
    include: { mill: true }
  });
  console.log("Latest Installation Reports:");
  latestInstallation.forEach(r => {
    console.log(`- ID: ${r.id}, No: ${r.report_number}, Mill: ${r.mill ? r.mill.name : 'None'}, Date: ${r.visit_date}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
