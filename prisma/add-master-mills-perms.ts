import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const NEW_PERMISSIONS = [
  { name: 'master_mills.view', description: 'View master mills' },
  { name: 'master_mills.create', description: 'Create master mills' },
  { name: 'master_mills.update', description: 'Update master mills' },
  { name: 'master_mills.delete', description: 'Delete master mills' },
  { name: 'master_mills.export', description: 'Export master mills' },
];

async function main() {
  console.log('🌱 Adding master_mills permissions...');

  // 1. Create permissions in DB
  const perms: { id: string; name: string; description: string | null }[] = [];
  for (const permission of NEW_PERMISSIONS) {
    const p = await prisma.permission.upsert({
      where: { name: permission.name },
      update: { description: permission.description },
      create: permission,
    });
    perms.push(p);
  }
  console.log(`✅ Created/upserted ${perms.length} master_mills permissions.`);

  // Helper function to assign permissions to a role
  const assignPermissionsToRole = async (roleName: string, actionSuffixes: string[]) => {
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
      console.log(`⚠️ Role not found: ${roleName}`);
      return;
    }

    for (const suffix of actionSuffixes) {
      const permName = `master_mills.${suffix}`;
      const perm = perms.find((p) => p.name === permName);
      if (perm) {
        const existing = await prisma.rolePermission.findFirst({
          where: { role_id: role.id, permission_id: perm.id },
        });

        if (!existing) {
          await prisma.rolePermission.create({
            data: { role_id: role.id, permission_id: perm.id },
          });
          console.log(`✅ Assigned ${permName} to role: ${roleName}`);
        } else {
          console.log(`ℹ️ ${permName} already assigned to role: ${roleName}`);
        }
      }
    }
  };

  // 2. Assign to roles
  await assignPermissionsToRole('Super Admin', ['view', 'create', 'update', 'delete', 'export']);
  await assignPermissionsToRole('Admin', ['view', 'create', 'update', 'delete', 'export']);
  await assignPermissionsToRole('Manager', ['view', 'create', 'update', 'export']);
  await assignPermissionsToRole('Service Engineer', ['view']);
  await assignPermissionsToRole('Viewer', ['view']);

  console.log('🎉 Done adding master_mills permissions!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
