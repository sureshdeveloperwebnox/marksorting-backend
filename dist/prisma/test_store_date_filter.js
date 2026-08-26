"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
async function test() {
    const sampleStores = await prisma.store.findMany({
        take: 10,
        orderBy: { created_at: 'desc' },
        select: {
            id: true,
            store_number: true,
            created_at: true,
            return_status: true,
        },
    });
    console.log('Sample Stores created_at:');
    sampleStores.forEach((s) => {
        console.log(` - ${s.store_number}: created_at=${s.created_at.toISOString()} (Local: ${s.created_at.toString()})`);
    });
    const testDate = '2026-08-26';
    const [fy, fm, fd] = testDate.split('-').map(Number);
    const from = new Date(fy, fm - 1, fd, 0, 0, 0, 0);
    const to = new Date(fy, fm - 1, fd, 23, 59, 59, 999);
    console.log('\nTesting Filter Range for', testDate);
    console.log('From Date Object:', from.toISOString(), 'Local:', from.toString());
    console.log('To Date Object:', to.toISOString(), 'Local:', to.toString());
    const filteredStores = await prisma.store.findMany({
        where: {
            deleted_at: null,
            created_at: {
                gte: from,
                lte: to,
            },
        },
        select: {
            id: true,
            store_number: true,
            created_at: true,
        },
    });
    console.log(`\nFiltered Stores count for ${testDate}: ${filteredStores.length}`);
    filteredStores.forEach((s) => console.log(`   ${s.store_number} (${s.created_at.toISOString()})`));
}
test().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=test_store_date_filter.js.map