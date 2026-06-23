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
  const where = {
    type: 'Service',
    deleted_at: null
  };
  
  const masterMills = await prisma.masterMill.findMany({
    where,
    include: {
      mill: true
    }
  });
  
  console.log("Service master mills count found:", masterMills.length);
  masterMills.forEach(m => {
    console.log(`- ID: ${m.id}, Invoice: ${m.invoice_no}, Ref: ${m.ref_no}, Type: ${m.type}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
