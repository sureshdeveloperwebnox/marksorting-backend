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
    const customers = await prisma.customer.findMany({
        where: { deleted_at: null }
    });
    console.log('CUSTOMERS:', customers.map((c) => ({ id: c.id, name: c.name, email: c.email })));
    const mills = await prisma.mill.findMany({
        where: { deleted_at: null },
        include: { customer: true }
    });
    console.log('MILLS:', mills.map((m) => ({ id: m.id, name: m.name, customer_id: m.customer_id, customer_name: m.customer?.name })));
    const technicians = await prisma.technician.findMany({
        where: { deleted_at: null }
    });
    console.log('TECHNICIANS:', technicians.map((t) => ({ id: t.id, name: t.full_name, email: t.email })));
}
main().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=check-records.js.map