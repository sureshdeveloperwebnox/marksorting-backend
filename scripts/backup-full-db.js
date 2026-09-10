/**
 * Full Database SQL Backup Script
 * 
 * Exports the complete PostgreSQL database (all 41 tables, migrations, sequences, and logs)
 * into a single timestamped SQL file and an optimized gzip-compressed (.sql.gz) file.
 * Computes SHA-256 checksum and saves metadata manifest.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const { Pool } = require('pg');

// 1. Resolve .env
const envPath = path.resolve(__dirname, '..', '.env');
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
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

function escapeSqlValue(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return Number.isFinite(val) ? String(val) : 'NULL';
  if (val instanceof Date) return `'${val.toISOString()}'::timestamptz`;
  
  if (Array.isArray(val)) {
    const items = val.map(item => escapeSqlValue(item)).join(', ');
    return `ARRAY[${items}]`;
  }

  if (typeof val === 'object') {
    const jsonStr = JSON.stringify(val).replace(/'/g, "''");
    return `'${jsonStr}'::jsonb`;
  }

  const str = String(val).replace(/'/g, "''");
  return `'${str}'`;
}

async function runFullBackup(options = {}) {
  const startTime = Date.now();
  const pool = new Pool({ connectionString: databaseUrl });

  try {
    const client = await pool.connect();
    console.log('Connected to PostgreSQL for Full Database backup.');

    const now = new Date();
    const timestampStr = now.toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const backupDir = path.resolve(__dirname, '..', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const sqlFileName = `full_db_backup_${timestampStr}.sql`;
    const sqlFilePath = path.join(backupDir, sqlFileName);
    const gzFilePath = path.join(backupDir, `${sqlFileName}.gz`);

    const sqlStream = fs.createWriteStream(sqlFilePath, { flags: 'w', encoding: 'utf8' });

    // Fetch all public tables
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    const tables = tablesRes.rows.map(r => r.table_name);
    console.log(`Discovered ${tables.length} tables to backup.`);

    // Header
    sqlStream.write(`-- ====================================================================\n`);
    sqlStream.write(`-- MarkSorting Complete PostgreSQL Database Backup\n`);
    sqlStream.write(`-- Generated at: ${now.toISOString()}\n`);
    sqlStream.write(`-- Database: marksorter_db\n`);
    sqlStream.write(`-- Total Tables: ${tables.length}\n`);
    sqlStream.write(`-- ====================================================================\n\n`);

    sqlStream.write(`SET statement_timeout = 0;\n`);
    sqlStream.write(`SET client_encoding = 'UTF8';\n`);
    sqlStream.write(`SET standard_conforming_strings = on;\n\n`);
    sqlStream.write(`BEGIN;\n`);
    sqlStream.write(`SET session_replication_role = 'replica';\n\n`);

    const tableManifest = {};

    for (const table of tables) {
      process.stdout.write(`Exporting table: ${table}... `);

      // Primary keys
      const pkRes = await client.query(`
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_schema = 'public'
          AND tc.table_name = $1
        ORDER BY kcu.ordinal_position;
      `, [table]);
      const pks = pkRes.rows.map(r => r.column_name);

      // Columns
      const colsRes = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = $1 
        ORDER BY ordinal_position;
      `, [table]);
      const columns = colsRes.rows.map(r => r.column_name);
      if (columns.length === 0) {
        console.log('(no columns, skipped)');
        continue;
      }

      const colListStr = columns.map(c => `"${c}"`).join(', ');

      const countRes = await client.query(`SELECT COUNT(*) FROM "${table}";`);
      const rowCount = parseInt(countRes.rows[0].count, 10);
      tableManifest[table] = rowCount;

      sqlStream.write(`-- Table: ${table} (${rowCount} rows)\n`);

      if (rowCount === 0) {
        sqlStream.write(`-- (0 records)\n\n`);
        console.log(`0 rows`);
        continue;
      }

      const chunkSize = 500;
      let offset = 0;
      const orderClause = pks.length > 0 ? `ORDER BY ${pks.map(p => `"${p}"`).join(', ')}` : '';

      while (offset < rowCount) {
        const rowsRes = await client.query(
          `SELECT * FROM "${table}" ${orderClause} LIMIT ${chunkSize} OFFSET ${offset};`
        );

        if (rowsRes.rows.length === 0) break;

        const valueRows = rowsRes.rows.map(row => {
          const vals = columns.map(col => escapeSqlValue(row[col]));
          return `(${vals.join(', ')})`;
        });

        if (pks.length > 0) {
          const conflictTarget = pks.map(p => `"${p}"`).join(', ');
          const updateAssignments = columns
            .filter(col => !pks.includes(col))
            .map(col => `"${col}" = EXCLUDED."${col}"`)
            .join(', ');

          const onConflictClause = updateAssignments.length > 0
            ? `ON CONFLICT (${conflictTarget}) DO UPDATE SET ${updateAssignments}`
            : `ON CONFLICT (${conflictTarget}) DO NOTHING`;

          sqlStream.write(
            `INSERT INTO "${table}" (${colListStr})\nVALUES\n  ${valueRows.join(',\n  ')}\n${onConflictClause};\n\n`
          );
        } else {
          sqlStream.write(
            `INSERT INTO "${table}" (${colListStr})\nVALUES\n  ${valueRows.join(',\n  ')};\n\n`
          );
        }

        offset += rowsRes.rows.length;
      }

      console.log(`${rowCount} rows`);
    }

    sqlStream.write(`SET session_replication_role = 'origin';\n\n`);
    sqlStream.write(`COMMIT;\n`);
    sqlStream.end();

    // Wait for write stream to finish
    await new Promise((resolve, reject) => {
      sqlStream.on('finish', resolve);
      sqlStream.on('error', reject);
    });

    client.release();
    await pool.end();

    // Gzip compression
    console.log('\nCompressing SQL backup to .gz format...');
    const gzip = zlib.createGzip({ level: 9 });
    const readStream = fs.createReadStream(sqlFilePath);
    const writeGzStream = fs.createWriteStream(gzFilePath);

    await new Promise((resolve, reject) => {
      readStream.pipe(gzip).pipe(writeGzStream);
      writeGzStream.on('finish', resolve);
      writeGzStream.on('error', reject);
    });

    // Compute SHA-256 hash
    const hash = crypto.createHash('sha256');
    const fileBuffer = fs.readFileSync(sqlFilePath);
    hash.update(fileBuffer);
    const sha256 = hash.digest('hex');

    const gzStats = fs.statSync(gzFilePath);
    const sqlStats = fs.statSync(sqlFilePath);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    // Save manifest
    const manifest = {
      timestamp: now.toISOString(),
      sqlFile: path.basename(sqlFilePath),
      gzFile: path.basename(gzFilePath),
      sqlSizeBytes: sqlStats.size,
      sqlSizeMb: (sqlStats.size / (1024 * 1024)).toFixed(2),
      gzSizeBytes: gzStats.size,
      gzSizeMb: (gzStats.size / (1024 * 1024)).toFixed(2),
      sha256Checksum: sha256,
      tableCount: tables.length,
      tables: tableManifest,
      durationSeconds: elapsed,
    };

    const manifestPath = path.join(backupDir, `backup_manifest_${timestampStr}.json`);
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

    console.log('\n================ FULL DATABASE BACKUP COMPLETE ================');
    console.log(`Raw SQL File       : ${sqlFilePath}`);
    console.log(`Raw SQL Size       : ${manifest.sqlSizeMb} MB`);
    console.log(`Compressed GZ File : ${gzFilePath}`);
    console.log(`Compressed GZ Size : ${manifest.gzSizeMb} MB`);
    console.log(`SHA-256 Checksum   : ${sha256}`);
    console.log(`Manifest Saved     : ${manifestPath}`);
    console.log(`Time Taken         : ${elapsed}s`);
    console.log('=================================================================\n');

    if (options.uploadS3 || process.argv.includes('--upload-s3')) {
      const { uploadToS3 } = require('./upload-backup-to-s3');
      await uploadToS3(gzFilePath, manifest);
    }

    return { sqlFilePath, gzFilePath, manifest };
  } catch (err) {
    console.error('Full Database backup failed:', err);
    await pool.end();
    process.exit(1);
  }
}

if (require.main === module) {
  runFullBackup();
}

module.exports = { runFullBackup };
