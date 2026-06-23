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
  // 1. Find the mill
  const mill = await prisma.mill.findFirst({
    where: {
      name: {
        contains: 'Al Ameen',
        mode: 'insensitive'
      }
    }
  });
  console.log("Mill in DB:", mill);

  if (mill) {
    // 2. Find any MasterMill linked to this mill
    const masterMill = await prisma.masterMill.findFirst({
      where: {
        mill_id: mill.id
      }
    });
    console.log("MasterMill linked to this mill:", masterMill);
  }

  // 3. Find any MasterMill that matches 'Al Ameen' in any field
  const matchMasterMills = await prisma.masterMill.findMany({
    where: {
      OR: [
        { invoice_no: { contains: 'Al Ameen', mode: 'insensitive' } },
        { ref_no: { contains: 'Al Ameen', mode: 'insensitive' } },
        { address: { contains: 'Al Ameen', mode: 'insensitive' } },
        { place: { contains: 'Al Ameen', mode: 'insensitive' } },
      ]
    }
  });
  console.log("MasterMills matching 'Al Ameen' in address/place/etc.:", matchMasterMills);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
