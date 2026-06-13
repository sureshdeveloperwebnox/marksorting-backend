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
    const customers = await prisma.customer.findMany();
    console.log('CUSTOMERS COUNT:', customers.length);
    console.log('CUSTOMERS:', customers);
    const mills = await prisma.mill.findMany();
    console.log('MILLS COUNT:', mills.length);
    console.log('MILLS:', mills);
}
main().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=check_customers.js.map