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
    console.log('Adding activity_logs.view permission...');
    const permission = await prisma.permission.upsert({
        where: { name: 'activity_logs.view' },
        update: {},
        create: {
            name: 'activity_logs.view',
            description: 'View activity logs',
        },
    });
    console.log('Permission created:', permission);
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
//# sourceMappingURL=add-activity-log-perm.js.map