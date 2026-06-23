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
  const recent = await prisma.masterMill.findMany({
    orderBy: { created_at: 'desc' },
    take: 5,
    include: {
      mill: true
    }
  });

  console.log("Recent Master Mills in DB:");
  recent.forEach((m, idx) => {
    console.log(`${idx + 1}. ID: ${m.id}, Invoice: ${m.invoice_no}, Ref: ${m.ref_no}, Type: ${m.type}, Created At: ${m.created_at}, Deleted: ${m.deleted_at}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
