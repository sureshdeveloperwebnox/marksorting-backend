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
    console.log('Checking for orphaned services permissions...\n');
    const servicePerms = await prisma.permission.findMany({
        where: { name: { startsWith: 'services.' } }
    });
    if (servicePerms.length === 0) {
        console.log('No services permissions found - all clean!');
    }
    else {
        console.log('Found services permissions:', servicePerms.map(p => p.name));
        for (const perm of servicePerms) {
            const deletedRolePerms = await prisma.rolePermission.deleteMany({
                where: { permission_id: perm.id }
            });
            console.log(`Deleted ${deletedRolePerms.count} role permission associations for ${perm.name}`);
        }
        const deleted = await prisma.permission.deleteMany({
            where: { name: { startsWith: 'services.' } }
        });
        console.log(`\nDeleted ${deleted.count} services permissions`);
    }
    console.log('\n✅ Cleanup complete!');
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=cleanup-services-perm.js.map