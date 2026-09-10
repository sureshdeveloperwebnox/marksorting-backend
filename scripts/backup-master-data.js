/**
 * Master Data SQL Backup Script
 * 
 * Exports all foundational master & reference tables from PostgreSQL (marksorter_db)
 * in strict foreign-key dependency order.
 * Generates an idempotent, fully portable SQL script with transaction management
 * and conflict handling.
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// 1. Resolve .env from backend root
const envPath = path.resolve(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.error(`Error: .env file not found at ${envPath}`);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});

const databaseUrl = process.env.DATABASE_URL || env.DATABASE_URL;
if (!databaseUrl) {
  console.error('Error: DATABASE_URL not found in environment or .env');
  process.exit(1);
}

// 2. Master data tables in topological dependency order
const MASTER_TABLES = [
  { table: 'roles', pk: ['id'] },
  { table: 'permissions', pk: ['id'] },
  { table: 'role_permissions', pk: ['role_id', 'permission_id'] },
  { table: 'users', pk: ['id'] },
  { table: 'settings', pk: ['id'] },
  { table: 'customers', pk: ['id'] },
  { table: 'technicians', pk: ['id'] },
  { table: 'service_categories', pk: ['id'] },
  { table: 'expense_categories', pk: ['id'] },
  { table: 'materials', pk: ['id'] },
  { table: 'product_services', pk: ['id'] },
  { table: 'mills', pk: ['id'] },
  { table: 'master_mills', pk: ['id'] },
  { table: 'stores', pk: ['id'] },
  { table: 'store_materials', pk: ['store_id', 'material_id'] },
];

function escapeSqlValue(val, udtType) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return Number.isFinite(val) ? String(val) : 'NULL';
  if (val instanceof Date) return `'${val.toISOString()}'::timestamptz`;
  
  if (Array.isArray(val)) {
    // Format postgres array literal, e.g. ARRAY['a','b']::text[]
    const items = val.map(item => escapeSqlValue(item, 'text')).join(', ');
    return `ARRAY[${items}]`;
  }

  if (typeof val === 'object') {
    // Format JSON/JSONB
    const jsonStr = JSON.stringify(val).replace(/'/g, "''");
    return `'${jsonStr}'::jsonb`;
  }

  // String / text / uuid / timestamp strings
  const str = String(val).replace(/'/g, "''");
  return `'${str}'`;
}

async function runMasterBackup() {
  const startTime = Date.now();
  const pool = new Pool({ connectionString: databaseUrl });

  try {
    const client = await pool.connect();
    console.log('Connected to PostgreSQL database for Master Data backup.');

    const now = new Date();
    const timestampStr = now.toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const backupDir = path.resolve(__dirname, '..', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const outputFile = path.join(backupDir, `master_data_backup_${timestampStr}.sql`);
    const stream = fs.createWriteStream(outputFile, { flags: 'w', encoding: 'utf8' });

    // Header
    stream.write(`-- ====================================================================\n`);
    stream.write(`-- MarkSorting Master Data SQL Backup\n`);
    stream.write(`-- Generated at: ${now.toISOString()}\n`);
    stream.write(`-- Tables: ${MASTER_TABLES.map(t => t.table).join(', ')}\n`);
    stream.write(`-- ====================================================================\n\n`);

    stream.write(`SET statement_timeout = 0;\n`);
    stream.write(`SET client_encoding = 'UTF8';\n`);
    stream.write(`SET standard_conforming_strings = on;\n\n`);

    stream.write(`BEGIN;\n\n`);
    // Disable triggers/foreign key checks during bulk restoration for speed and flexibility
    stream.write(`-- Temporarily disable foreign key constraints during restore\n`);
    stream.write(`SET session_replication_role = 'replica';\n\n`);

    const tableStats = {};

    for (const { table, pk } of MASTER_TABLES) {
      console.log(`Processing table: ${table}...`);

      // Check if table exists
      const tableCheck = await client.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = $1
        );`,
        [table]
      );

      if (!tableCheck.rows[0].exists) {
        console.warn(`  Table public."${table}" does not exist, skipping.`);
        continue;
      }

      // Fetch columns
      const colsRes = await client.query(
        `SELECT column_name, udt_name 
         FROM information_schema.columns 
         WHERE table_schema = 'public' AND table_name = $1 
         ORDER BY ordinal_position;`,
        [table]
      );

      const columns = colsRes.rows.map(r => r.column_name);
      if (columns.length === 0) continue;

      const colListStr = columns.map(c => `"${c}"`).join(', ');

      // Stream rows in chunks
      const countRes = await client.query(`SELECT COUNT(*) FROM "${table}";`);
      const totalRows = parseInt(countRes.rows[0].count, 10);
      tableStats[table] = totalRows;
      console.log(`  Found ${totalRows} rows in "${table}".`);

      stream.write(`-- Table: ${table} (${totalRows} records)\n`);

      if (totalRows === 0) {
        stream.write(`-- (0 records)\n\n`);
        continue;
      }

      const chunkSize = 500;
      let offset = 0;

      while (offset < totalRows) {
        const rowsRes = await client.query(
          `SELECT * FROM "${table}" ORDER BY ${pk.map(p => `"${p}"`).join(', ')} LIMIT ${chunkSize} OFFSET ${offset};`
        );

        if (rowsRes.rows.length === 0) break;

        const valueRows = rowsRes.rows.map(row => {
          const vals = columns.map(col => escapeSqlValue(row[col]));
          return `(${vals.join(', ')})`;
        });

        const conflictTarget = pk.map(p => `"${p}"`).join(', ');
        const updateAssignments = columns
          .filter(col => !pk.includes(col))
          .map(col => `"${col}" = EXCLUDED."${col}"`)
          .join(', ');

        const onConflictClause = updateAssignments.length > 0
          ? `ON CONFLICT (${conflictTarget}) DO UPDATE SET ${updateAssignments}`
          : `ON CONFLICT (${conflictTarget}) DO NOTHING`;

        stream.write(
          `INSERT INTO "${table}" (${colListStr})\nVALUES\n  ${valueRows.join(',\n  ')}\n${onConflictClause};\n\n`
        );

        offset += rowsRes.rows.length;
      }

      stream.write(`\n`);
    }

    // Re-enable triggers and commit
    stream.write(`-- Re-enable constraints\n`);
    stream.write(`SET session_replication_role = 'origin';\n\n`);
    stream.write(`COMMIT;\n`);

    stream.end();
    client.release();
    await pool.end();

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    const fileStats = fs.statSync(outputFile);
    const sizeMb = (fileStats.size / (1024 * 1024)).toFixed(2);

    console.log('\n================ MASTER DATA BACKUP COMPLETE ================');
    console.log(`Output File: ${outputFile}`);
    console.log(`File Size  : ${sizeMb} MB (${fileStats.size} bytes)`);
    console.log(`Time Taken : ${elapsed}s`);
    console.log('Record Breakdown:');
    for (const [tbl, cnt] of Object.entries(tableStats)) {
      console.log(`  - ${tbl.padEnd(20)}: ${cnt} rows`);
    }
    console.log('==============================================================\n');

    return { outputFile, sizeMb, tableStats };
  } catch (err) {
    console.error('Master Data backup failed:', err);
    await pool.end();
    process.exit(1);
  }
}

if (require.main === module) {
  runMasterBackup();
}

module.exports = { runMasterBackup };
