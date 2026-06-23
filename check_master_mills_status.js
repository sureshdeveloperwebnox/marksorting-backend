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
  const allWarrantyGroups = await prisma.masterMill.groupBy({
    by: ['all_warranty'],
    _count: { id: true }
  });
  console.log("Grouping by all_warranty:", allWarrantyGroups);

  const nullWarrantyRecords = await prisma.masterMill.findMany({
    where: { all_warranty: null },
    select: { id: true, invoice_no: true, type: true, status: true }
  });
  console.log("Records with null all_warranty:", nullWarrantyRecords);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
