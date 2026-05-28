import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Adding activity_logs.view permission...');

  // Create the permission
  const permission = await prisma.permission.upsert({
    where: { name: 'activity_logs.view' },
    update: {},
    create: {
      name: 'activity_logs.view',
      description: 'View activity logs',
    },
  });

  console.log('Permission created:', permission);

  // Assign to Super Admin role
  const superAdminRole = await prisma.role.findUnique({
    where: { name: 'Super Admin' },
  });

  if (superAdminRole) {
    const existing = await prisma.rolePermission.findFirst({
      where: {
        role_id: superAdminRole.id,
        permission_id: permission.id,
      },
    });

    if (!existing) {
      await prisma.rolePermission.create({
        data: {
          role_id: superAdminRole.id,
          permission_id: permission.id,
        },
      });
      console.log('Assigned to Super Admin role');
    }
  }

  // Assign to Admin role
  const adminRole = await prisma.role.findUnique({
    where: { name: 'Admin' },
  });

  if (adminRole) {
    const existing = await prisma.rolePermission.findFirst({
      where: {
        role_id: adminRole.id,
        permission_id: permission.id,
      },
    });

    if (!existing) {
      await prisma.rolePermission.create({
        data: {
          role_id: adminRole.id,
          permission_id: permission.id,
        },
      });
      console.log('Assigned to Admin role');
    }
  }

  console.log('Done!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
