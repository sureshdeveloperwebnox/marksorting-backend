import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'admin@marksorting.com' }
  });
  if (!user) {
    console.log('No user found');
    return;
  }
  const match = await bcrypt.compare('password123', user.password_hash);
  console.log('PASSWORD MATCH password123:', match);
}

main().catch(console.error).finally(() => prisma.$disconnect());
