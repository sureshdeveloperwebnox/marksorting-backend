"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    console.log('🔍 Checking stale "services.*" permissions...');
    const stalePerms = await prisma.permission.findMany({
        where: { name: { startsWith: 'services.' } },
    });
    if (stalePerms.length === 0) {
        console.log('✅ No stale services.* permissions found. Nothing to clean up.');
        return;
    }
    console.log(`⚠️  Found ${stalePerms.length} stale permission(s):`);
    stalePerms.forEach((p) => console.log(`   - ${p.name}`));
    const staleIds = stalePerms.map((p) => p.id);
    const deleted = await prisma.rolePermission.deleteMany({
        where: { permission_id: { in: staleIds } },
    });
    console.log(`🗑️  Removed ${deleted.count} role-permission assignments.`);
    const removedPerms = await prisma.permission.deleteMany({
        where: { id: { in: staleIds } },
    });
    console.log(`🗑️  Deleted ${removedPerms.count} stale permissions.`);
    const NEEDED = [
        { name: 'service_categories.view', description: 'View service categories' },
        { name: 'service_categories.create', description: 'Create service categories' },
        { name: 'service_categories.update', description: 'Update service categories' },
        { name: 'service_categories.delete', description: 'Delete service categories' },
        { name: 'service_reports.view', description: 'View service reports' },
        { name: 'service_reports.create', description: 'Create service reports' },
        { name: 'service_reports.update', description: 'Update service reports' },
        { name: 'service_reports.delete', description: 'Delete service reports' },
        { name: 'service_reports.export', description: 'Export service reports' },
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
//# sourceMappingURL=fix-services-perms.js.map