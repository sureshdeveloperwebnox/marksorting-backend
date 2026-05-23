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
    const reports = await prisma.serviceReport.findMany();
    console.log(`Found ${reports.length} service reports.`);
    for (const report of reports) {
        const match = report.report_number.match(/^(SR-\d{8}-)(\d{4})$/);
        if (match) {
            const prefix = match[1];
            const seqStr = match[2];
            const seqNum = parseInt(seqStr, 10);
            const newReportNumber = `${prefix}${seqNum}`;
            console.log(`Updating ${report.report_number} -> ${newReportNumber}`);
            await prisma.serviceReport.update({
                where: { id: report.id },
                data: { report_number: newReportNumber }
            });
        }
    }
    console.log('Update complete.');
}
main().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=update-report-numbers.js.map