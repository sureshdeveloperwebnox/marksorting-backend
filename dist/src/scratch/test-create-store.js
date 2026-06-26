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
    const customer = await prisma.customer.findFirst();
    const technician = await prisma.technician.findFirst();
    if (!customer || !technician) {
        console.log('No customer or technician found in DB');
        return;
    }
    console.log('Found Customer:', customer.id);
    console.log('Found Technician:', technician.id);
    try {
        const store = await prisma.store.create({
            data: {
                service_engineer_id: technician.id,
                customer_id: customer.id,
                quantity: 1,
                warranty_status: 'Non Warranty',
                frame_number: 'TEST-FRAME-' + Date.now(),
                return_status: 'Pending',
                inflow_status: 'Available',
            }
        });
        console.log('Successfully created store!', store.id);
    }
    catch (err) {
        console.error('Error creating store:', err.message);
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=test-create-store.js.map