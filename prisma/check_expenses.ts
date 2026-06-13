import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const client = await pool.connect();
  try {
    console.log('\nQuerying settings...');
    const settings = await client.query(`
      SELECT * FROM settings;
    `);
    console.log('Settings:', settings.rows);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);

