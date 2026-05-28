import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function checkAndUpdateUsers() {
  try {
    // Check existing users
    const users = await prisma.user.findMany({
      select: { 
        id: true,
        email: true, 
        full_name: true, 
        role: { select: { name: true } } 
      }
    });
    console.log('Existing users:', JSON.stringify(users, null, 2));

    // Get Super Admin role
    const superAdminRole = await prisma.role.findUnique({
      where: { name: 'Super Admin' }
    });

    if (!superAdminRole) {
      console.log('Super Admin role not found');
      return;
    }

    // Update admin@marksorting.com user to have Super Admin role
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@marksorting.com' }
    });

    if (adminUser) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await prisma.user.update({
        where: { id: adminUser.id },
        data: {
          password_hash: hashedPassword,
          role_id: superAdminRole.id,
          account_status: 'ACTIVE',
          email_verified: true,
        }
      });
      console.log('Updated admin@marksorting.com user with Super Admin role');
    } else {
      // Create the admin user if it doesn't exist
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await prisma.user.create({
        data: {
          email: 'admin@marksorting.com',
          full_name: 'Super Admin',
          password_hash: hashedPassword,
          role_id: superAdminRole.id,
          account_status: 'ACTIVE',
          email_verified: true,
        }
      });
      console.log('Created admin@marksorting.com user with Super Admin role');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndUpdateUsers();
