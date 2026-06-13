import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🔍 Checking stale "services.*" permissions...');

  // Find all permissions with the old "services." prefix (the stale ones)
  const stalePerms = await prisma.permission.findMany({
    where: { name: { startsWith: 'services.' } },
  });

  if (stalePerms.length === 0) {
    console.log('✅ No stale services.* permissions found. Nothing to clean up.');
    return;
  }

  console.log(`⚠️  Found ${stalePerms.length} stale permission(s):`);
  stalePerms.forEach((p) => console.log(`   - ${p.name}`));

  // Remove role assignments for these permissions first
  const staleIds = stalePerms.map((p) => p.id);
  const deleted = await prisma.rolePermission.deleteMany({
    where: { permission_id: { in: staleIds } },
  });
  console.log(`🗑️  Removed ${deleted.count} role-permission assignments.`);

  // Delete the stale permissions themselves
  const removedPerms = await prisma.permission.deleteMany({
    where: { id: { in: staleIds } },
  });
  console.log(`🗑️  Deleted ${removedPerms.count} stale permissions.`);

  // Now ensure service_categories and service_reports have full CRUD
  const NEEDED = [
    { name: 'service_categories.view',   description: 'View service categories' },
    { name: 'service_categories.create', description: 'Create service categories' },
    { name: 'service_categories.update', description: 'Update service categories' },
    { name: 'service_categories.delete', description: 'Delete service categories' },
    { name: 'service_reports.view',      description: 'View service reports' },
    { name: 'service_reports.create',    description: 'Create service reports' },
    { name: 'service_reports.update',    description: 'Update service reports' },
    { name: 'service_reports.delete',    description: 'Delete service reports' },
    { name: 'service_reports.export',    description: 'Export service reports' },
  ];

  console.log('\n🌱 Upserting service_categories & service_reports permissions...');
  for (const p of NEEDED) {
    await prisma.permission.upsert({
      where: { name: p.name },
      update: { description: p.description },
      create: p,
    });
    console.log(`  ✅ ${p.name}`);
  }

  console.log('\n🎉 Done! Stale "services" permissions removed, CRUD permissions ensured.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
