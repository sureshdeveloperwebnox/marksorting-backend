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
        select: {
            id: true,
            email: true,
            full_name: true,
            role: {
                select: {
                    name: true,
                }
            }
        }
    });
    console.log('USERS IN SYSTEM:', JSON.stringify(users, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=get_users.js.map