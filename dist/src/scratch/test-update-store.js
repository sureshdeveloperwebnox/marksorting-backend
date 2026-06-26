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
    const store = await prisma.store.findFirst();
    if (!store) {
        console.log('No store found in DB');
        return;
    }
    console.log('Found Store ID:', store.id);
    try {
        const updatedStore = await prisma.store.update({
            where: { id: store.id },
            data: {
                remarks: 'test-updated-remarks-' + Date.now(),
                service_engineer_id: store.service_engineer_id,
                customer_id: store.customer_id,
            }
        });
        console.log('Successfully updated store!', updatedStore.id);
    }
    catch (err) {
        console.error('Error updating store:', err.message);
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=test-update-store.js.map