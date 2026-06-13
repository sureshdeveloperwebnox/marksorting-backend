"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const pg_1 = require("pg");
const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
async function main() {
    const client = await pool.connect();
    try {
        console.log('\nQuerying settings...');
        const settings = await client.query(`
      SELECT * FROM settings;
    `);
        console.log('Settings:', settings.rows);
    }
    finally {
        client.release();
        await pool.end();
    }
}
main().catch(console.error);
//# sourceMappingURL=check_expenses.js.map