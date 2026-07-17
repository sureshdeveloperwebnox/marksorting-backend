"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const pg_1 = require("pg");
const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
async function main() {
    const client = await pool.connect();
    try {
        const res = await client.query('SELECT id, full_name, email, status, deleted_at FROM technicians;');
        console.log('TECHNICIANS:', res.rows);
        const exp = await client.query('SELECT id, expense_number, status, deleted_at FROM expenses ORDER BY created_at DESC LIMIT 5;');
        console.log('EXPENSES:', exp.rows);
        const expTechs = await client.query('SELECT expense_id, technician_id FROM expense_technicians;');
        console.log('EXPENSE_TECHNICIANS:', expTechs.rows);
    }
    finally {
        client.release();
        await pool.end();
    }
}
main().catch(console.error);
//# sourceMappingURL=inspect_technicians.js.map