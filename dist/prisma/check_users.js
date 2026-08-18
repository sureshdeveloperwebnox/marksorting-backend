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
    const users = await prisma.user.findMany({
        where: { deleted_at: null },
        select: {
            id: true,
            email: true,
            full_name: true,
            account_status: true,
            role: { select: { name: true } }
        },
        take: 10,
        orderBy: { created_at: 'asc' }
    });
    console.log('Admin users:');
    console.table(users);
}
main().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=check_users.js.map