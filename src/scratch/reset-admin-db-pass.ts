import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = 'admin@marksorting.com';
  const newPassword = 'Admin@1234';

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const user = await prisma.user.update({
      where: { email },
      data: { password_hash: hashedPassword },
    });
    console.log(
      `Successfully reset password for ${email} in database to ${newPassword}`,
    );
  } catch (error: any) {
    console.error('Error resetting password:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
