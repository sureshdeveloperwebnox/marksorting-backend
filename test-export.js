require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

console.log("DB URL from env:", process.env.DATABASE_URL);

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.$connect();
  console.log("Connected successfully");

  const total = await prisma.activityLog.count();
  console.log("Total activity logs in DB:", total);

  // Let's check the date range
  const firstLog = await prisma.activityLog.findFirst({
    orderBy: { created_at: 'asc' }
  });
  const lastLog = await prisma.activityLog.findFirst({
    orderBy: { created_at: 'desc' }
  });

  if (firstLog) console.log("Oldest log date:", firstLog.created_at);
  if (lastLog) console.log("Newest log date:", lastLog.created_at);

  // Query matching findAll export
  const logs = await prisma.activityLog.findMany({
    orderBy: { created_at: 'desc' },
    take: 10,
    include: {
      user: {
        select: {
          id: true,
          full_name: true,
          email: true,
        },
      },
    },
  });

  console.log("Found logs:", logs.length);
  if (logs.length > 0) {
    console.log("Sample log:", JSON.stringify(logs[0], null, 2));
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
