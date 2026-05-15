import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create Permissions
  const permissionsData = [
    { name: 'users.read', description: 'Can view users' },
    { name: 'users.create', description: 'Can create users' },
    { name: 'users.update', description: 'Can update users' },
    { name: 'users.delete', description: 'Can delete users' },
    { name: 'mills.manage', description: 'Can manage mills' },
    { name: 'services.manage', description: 'Can manage services' },
    { name: 'reports.view', description: 'Can view reports' },
  ];

  const permissions = [];
  for (const p of permissionsData) {
    const permission = await prisma.permission.upsert({
      where: { name: p.name },
      update: {},
      create: p,
    });
    permissions.push(permission);
  }

  // Create Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'SUPER_ADMIN' },
    update: {},
    create: {
      name: 'SUPER_ADMIN',
      description: 'Super administrator with all permissions',
    },
  });

  const userRole = await prisma.role.upsert({
    where: { name: 'USER' },
    update: {},
    create: {
      name: 'USER',
      description: 'Standard user with limited access',
    },
  });

  // Assign All Permissions to Admin Role
  for (const p of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        role_id_permission_id: {
          role_id: adminRole.id,
          permission_id: p.id,
        },
      },
      update: {},
      create: {
        role_id: adminRole.id,
        permission_id: p.id,
      },
    });
  }

  // Assign Limited Permissions to User Role (e.g., viewing reports only)
  const userPermissions = permissions.filter(p => p.name === 'reports.view');
  for (const p of userPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        role_id_permission_id: {
          role_id: userRole.id,
          permission_id: p.id,
        },
      },
      update: {},
      create: {
        role_id: userRole.id,
        permission_id: p.id,
      },
    });
  }

  // Create Admin User
  const hashedPassword = await bcrypt.hash('password123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@marksorting.com' },
    update: {
      password_hash: hashedPassword,
      role_id: adminRole.id,
    },
    create: {
      email: 'admin@marksorting.com',
      full_name: 'Admin User',
      password_hash: hashedPassword,
      role_id: adminRole.id,
      account_status: 'ACTIVE',
      email_verified: true,
    },
  });

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
