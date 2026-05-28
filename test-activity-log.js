const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Get current user
  const user = await prisma.user.findFirst({
    where: { email: 'admin@marksorting.com' }
  });
  
  if (!user) {
    console.log('No admin user found');
    return;
  }

  console.log('Creating test activity log for user:', user.email);

  // Create a test activity log
  const log = await prisma.activityLog.create({
    data: {
      user_id: user.id,
      action: 'UPDATE',
      entity_type: 'users',
      entity_id: user.id,
      description: `Updated user: Test User (test@example.com)`,
      ip_address: '127.0.0.1',
      user_agent: 'Test Script',
      metadata: {
        test: true,
        source: 'manual-test'
      }
    }
  });

  console.log('✅ Test activity log created:', log.id);
  
  // Check total logs
  const count = await prisma.activityLog.count();
  console.log(`Total activity logs in database: ${count}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
