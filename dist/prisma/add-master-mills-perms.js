"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
const NEW_PERMISSIONS = [
    { name: 'master_mills.view', description: 'View master mills' },
    { name: 'master_mills.create', description: 'Create master mills' },
    { name: 'master_mills.update', description: 'Update master mills' },
    { name: 'master_mills.delete', description: 'Delete master mills' },
    { name: 'master_mills.export', description: 'Export master mills' },
];
async function main() {
    console.log('🌱 Adding master_mills permissions...');
    const perms = [];
    for (const permission of NEW_PERMISSIONS) {
        const p = await prisma.permission.upsert({
            where: { name: permission.name },
            update: { description: permission.description },
            create: permission,
        });
        perms.push(p);
    }
    console.log(`✅ Created/upserted ${perms.length} master_mills permissions.`);
    const assignPermissionsToRole = async (roleName, actionSuffixes) => {
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
                }
                else {
                    console.log(`ℹ️ ${permName} already assigned to role: ${roleName}`);
                }
            }
        }
    };
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
//# sourceMappingURL=add-master-mills-perms.js.map