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
    const customerId = '0194f068-4a53-4118-9129-d3f8e96b8f02';
    const customer = await prisma.customer.findUnique({
        where: { id: customerId }
    });
    console.log('CUSTOMER DIRECT QUERY RESULT:', customer);
    const allCustomers = await prisma.customer.findMany();
    console.log('ALL CUSTOMERS (INCL DELETED):', allCustomers.map(c => ({ id: c.id, name: c.name, deleted_at: c.deleted_at })));
}
main().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=inspect-deleted-customer.js.map