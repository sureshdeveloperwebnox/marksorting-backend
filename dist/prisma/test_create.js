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
        const mill = await prisma.mill.findFirst();
        const category = await prisma.serviceCategory.findFirst();
        if (!mill || !category) {
            console.log('No mill or category found in DB');
            return;
        }
        const created = await prisma.serviceReport.create({
            data: {
                report_number: 'SR-TEST-' + Date.now(),
                service_category_id: category.id,
                mill_id: mill.id,
                place: 'dummy',
                mill_whatsapp_number: '1234567890',
                visit_date: new Date(),
                visit_time: '10:30',
                call_registered_date: new Date(),
                machine_model: 'dummy',
                serial_or_frame_no: 'dummy',
                authorized_person: 'dummy',
                nature_of_complaint: 'dummy',
                action_taken: 'dummy',
                engineer_remarks: 'dummy',
                engineer_signature: 'dummy',
                customer_signature: 'dummy',
                authorized_person_phone: '9876543210',
            }
        });
        console.log('Created successfully:', created.id);
        await prisma.serviceReport.delete({ where: { id: created.id } });
        console.log('Cleaned up successfully.');
    }
    catch (error) {
        console.log('PRISMA ERROR MESSAGE:');
        console.error(error.message);
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=test_create.js.map