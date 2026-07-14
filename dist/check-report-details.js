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
    console.log('Checking recent Service Reports and their technician/client phone numbers...\n');
    const serviceReports = await prisma.serviceReport.findMany({
        take: 5,
        orderBy: { created_at: 'desc' },
        include: {
            technicians: {
                include: {
                    technician: true
                }
            }
        }
    });
    serviceReports.forEach(sr => {
        console.log(`Service Report: ${sr.report_number}`);
        console.log(`  Client (Authorized Person Phone): ${sr.authorized_person_phone}`);
        console.log(`  Client (Mill WhatsApp Number): ${sr.mill_whatsapp_number}`);
        console.log(`  Technicians:`);
        sr.technicians.forEach(t => {
            console.log(`    - Name: ${t.technician.full_name}, Phone: ${t.technician.phone}`);
        });
        console.log('--------------------------------------------------');
    });
    console.log('\nChecking recent Installation Reports...\n');
    const installationReports = await prisma.installationReport.findMany({
        take: 5,
        orderBy: { created_at: 'desc' },
        include: {
            technicians: {
                include: {
                    technician: true
                }
            }
        }
    });
    installationReports.forEach(ir => {
        console.log(`Installation Report: ${ir.report_number}`);
        console.log(`  Client (Authorized Person Phone): ${ir.authorized_person_phone}`);
        console.log(`  Client (Mill WhatsApp Number): ${ir.mill_whatsapp_number}`);
        console.log(`  Technicians:`);
        ir.technicians.forEach(t => {
            console.log(`    - Name: ${t.technician.full_name}, Phone: ${t.technician.phone}`);
        });
        console.log('--------------------------------------------------');
    });
}
main().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=check-report-details.js.map