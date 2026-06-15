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
    const search = 'P-00988';
    const orConditions = [
        { invoice_no: { contains: search, mode: 'insensitive' } },
        { ref_no: { contains: search, mode: 'insensitive' } },
        { mc_model: { contains: search, mode: 'insensitive' } },
        { frame_no: { contains: search, mode: 'insensitive' } },
        { place: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { mill: { name: { contains: search, mode: 'insensitive' } } },
    ];
    const results = await prisma.masterMill.findMany({
        where: {
            OR: orConditions,
            status: 'ACTIVE',
            deleted_at: null
        },
        include: {
            mill: true
        }
    });
    console.log('RESULTS FOR P-00988:', JSON.stringify(results, null, 2));
    const orConditionsWithMillRef = [
        ...orConditions,
        { mill: { ref_no: { contains: search, mode: 'insensitive' } } }
    ];
    const resultsWithMillRef = await prisma.masterMill.findMany({
        where: {
            OR: orConditionsWithMillRef,
            status: 'ACTIVE',
            deleted_at: null
        },
        include: {
            mill: true
        }
    });
    console.log('RESULTS WITH MILL REF NO SEARCH:', JSON.stringify(resultsWithMillRef, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=test_search.js.map