"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
async function check() {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            full_name: true,
            account_status: true,
            deleted_at: true,
            role: { select: { id: true, name: true } },
            push_tokens: { select: { id: true, token: true, updated_at: true } }
        }
    });
    console.log('--- ALL USERS WITH ROLES & PUSH TOKENS ---');
    for (const u of users) {
        console.log(`User: ${u.full_name} (${u.email}) | Role: '${u.role?.name}' | Status: ${u.account_status} | Deleted: ${u.deleted_at} | Tokens: ${u.push_tokens.length}`);
        for (const pt of u.push_tokens) {
            console.log(`   - Token ID: ${pt.id}, Updated: ${pt.updated_at}, Token: ${pt.token.substring(0, 25)}...`);
        }
    }
    console.log('\n--- ALL ROLES IN DB ---');
    const roles = await prisma.role.findMany();
    console.log(roles.map(r => `Role ID: ${r.id}, Name: "${r.name}"`));
}
check().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=check_users.js.map