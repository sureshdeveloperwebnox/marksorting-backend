import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Finding all soft-deleted users...');
  const deletedUsers = await prisma.user.findMany({
    where: {
      deleted_at: { not: null }
    }
  });

  console.log(`Found ${deletedUsers.length} soft-deleted users.`);

  for (const user of deletedUsers) {
    const timestamp = Date.now();
    const newEmail = user.email.includes('_deleted_') 
      ? user.email 
      : `${user.email}_deleted_${timestamp}`;
    const newPhone = user.phone_number 
      ? (user.phone_number.includes('_deleted_') ? user.phone_number : `${user.phone_number}_deleted_${timestamp}`)
      : null;

    console.log(`Renaming user ${user.id}: ${user.email} -> ${newEmail}`);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        email: newEmail,
        phone_number: newPhone
      }
    });

    // Also check and rename corresponding technician
    const technician = await prisma.technician.findUnique({
      where: { id: user.id }
    });
    if (technician) {
      console.log(`Renaming technician ${technician.id}: ${technician.email} -> ${newEmail}`);
      await prisma.technician.update({
        where: { id: technician.id },
        data: {
          email: newEmail,
          phone: newPhone
        }
      });
    }
  }

  console.log('Migration complete!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
