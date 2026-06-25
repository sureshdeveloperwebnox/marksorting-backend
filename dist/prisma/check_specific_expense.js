"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const pg_1 = require("pg");
const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
async function main() {
    const client = await pool.connect();
    try {
        console.log('\n--- Querying Specific Expenses ---');
        const res = await client.query(`
      SELECT expense_number, amount, admin_amount, status FROM expenses ORDER BY visit_date DESC;
    `);
        console.log(res.rows);
    }
    finally {
        client.release();
        await pool.end();
    }
}
main().catch(console.error);
//# sourceMappingURL=check_specific_expense.js.map