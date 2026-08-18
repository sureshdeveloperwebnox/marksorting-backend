import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const newPassword = 'Admin@1234';
  const hash = await bcrypt.hash(newPassword, 10);

  // Update admin@marksorting.com
  const result = await prisma.user.update({
    where: { email: 'admin@marksorting.com' },
    data: {
      password_hash: hash,
      failed_login_attempts: 0,
      locked_until: null,
    },
    select: { email: true, full_name: true, account_status: true }
  });

  console.log('Password updated for:', result);
  console.log(`\nYou can now login with:\n  Email: admin@marksorting.com\n  Password: Admin@1234`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
