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
    console.log('=== USERS ===');
    const users = await prisma.user.findMany({
        select: { id: true, email: true, full_name: true, role: { select: { name: true } } }
    });
    console.log(users);
    console.log('=== TECHNICIANS ===');
    const technicians = await prisma.technician.findMany({
        select: { id: true, email: true, full_name: true }
    });
    console.log(technicians);
    console.log('=== SERVICE REPORTS ===');
    const serviceReports = await prisma.serviceReport.findMany({
        where: { deleted_at: null },
        select: {
            id: true,
            report_number: true,
            expense_id: true,
            technicians: {
                select: {
                    technician_id: true,
                    technician: { select: { full_name: true } }
                }
            },
            expenses: {
                select: {
                    id: true,
                    expense_number: true,
                    deleted_at: true
                }
            }
        }
    });
    console.log(serviceReports);
    console.log('=== INSTALLATION REPORTS ===');
    const installationReports = await prisma.installationReport.findMany({
        where: { deleted_at: null },
        select: {
            id: true,
            report_number: true,
            expense_id: true,
            technicians: {
                select: {
                    technician_id: true,
                    technician: { select: { full_name: true } }
                }
            },
            expenses: {
                select: {
                    id: true,
                    expense_number: true,
                    deleted_at: true
                }
            }
        }
    });
    console.log(installationReports);
    console.log('=== EXPENSES ===');
    const expenses = await prisma.expense.findMany({
        where: { deleted_at: null },
        select: {
            id: true,
            expense_number: true,
            service_report_id: true,
            installation_report_id: true,
            technicians: {
                select: {
                    technician_id: true,
                    technician: { select: { full_name: true } }
                }
            }
        }
    });
    console.log(expenses);
}
main().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=inspect_db.js.map