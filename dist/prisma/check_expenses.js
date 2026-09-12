"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const pg_1 = require("pg");
const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
async function main() {
    const client = await pool.connect();
    try {
        console.log('\n--- Querying Installation Reports ---');
        const irs = await client.query(`
      SELECT id, report_number, deleted_at FROM installation_reports;
    `);
        console.log(irs.rows);
        console.log('\n--- Querying Expenses ---');
        const expenses = await client.query(`
      SELECT id, expense_number, service_report_id, installation_report_id, deleted_at FROM expenses;
    `);
        console.log(expenses.rows);
        console.log('\n--- Querying Installation Report Technicians ---');
        const irTechs = await client.query(`
      SELECT installation_report_id, technician_id FROM installation_report_technicians;
    `);
        console.log(irTechs.rows);
    }
    finally {
        client.release();
        await pool.end();
    }
}
main().catch(console.error);
//# sourceMappingURL=check_expenses.js.map