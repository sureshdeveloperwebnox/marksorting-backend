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
    try {
        const ticketCount = await prisma.supportTicket.count();
        console.log('support_tickets table exists. Count:', ticketCount);
    }
    catch (error) {
        console.error('Error querying support_tickets:', error.message);
    }
    try {
        const settingCount = await prisma.setting.count();
        console.log('settings table exists. Count:', settingCount);
    }
    catch (error) {
        console.error('Error querying settings:', error.message);
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=check_tables.js.map