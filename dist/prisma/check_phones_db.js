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
    const millPhones = await prisma.mill.findMany({
        select: { phone: true },
        distinct: ['phone'],
        where: { phone: { not: null } }
    });
    console.log('Distinct mill phones count:', millPhones.length);
    console.log('Distinct mill phones:', millPhones.map(m => m.phone));
}
main().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=check_phones_db.js.map