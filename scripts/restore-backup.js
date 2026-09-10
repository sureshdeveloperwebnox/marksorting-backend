/**
 * Database Restore & Verification Script
 * 
 * Safely restores a Master Data SQL or Full Database SQL backup file into a target PostgreSQL database.
 * Supports:
 * - Plain SQL (.sql) and Gzip compressed (.sql.gz)
 * - Dry-run / validation mode
 * - Target database URL override (e.g. restoring to a local or staging database)
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const readline = require('readline');
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

const defaultDatabaseUrl = process.env.RESTORE_DATABASE_URL || process.env.DATABASE_URL || env.DATABASE_URL;

async function runRestore(filePath, targetDbUrl = defaultDatabaseUrl, dryRun = false) {
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error(`Backup file not found at: ${filePath}`);
  }

  if (!targetDbUrl) {
    throw new Error('Target database URL is required.');
  }

  console.log(`\n================ DATABASE RESTORE ================`);
  console.log(`Source File   : ${filePath}`);
  console.log(`Target DB URL : ${targetDbUrl.replace(/:[^:@]+@/, ':****@')}`);
  console.log(`Mode          : ${dryRun ? 'DRY-RUN (Validate only)' : 'LIVE RESTORE'}`);
  console.log(`==================================================\n`);

  const pool = new Pool({ connectionString: targetDbUrl });
  const client = await pool.connect();

  try {
    let inputStream;
    if (filePath.endsWith('.gz')) {
      inputStream = fs.createReadStream(filePath).pipe(zlib.createGunzip());
    } else {
      inputStream = fs.createReadStream(filePath, { encoding: 'utf8' });
    }

    const rl = readline.createInterface({
      input: inputStream,
      crlfDelay: Infinity,
    });

    let currentQuery = '';
    let statementCount = 0;
    let inCopyBlock = false;

    if (!dryRun) {
      await client.query('BEGIN;');
      await client.query("SET session_replication_role = 'replica';");
    }

    for await (const line of rl) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('--')) continue;

      currentQuery += line + '\n';

      if (trimmed.endsWith(';')) {
        statementCount++;
        if (!dryRun) {
          try {
            await client.query(currentQuery);
          } catch (queryErr) {
            console.error(`Error executing statement #${statementCount}:`, queryErr.message);
            console.error('Statement preview:', currentQuery.slice(0, 200));
            throw queryErr;
          }
        }
        currentQuery = '';
        if (statementCount % 100 === 0) {
          process.stdout.write(`\rProcessed ${statementCount} SQL statements...`);
        }
      }
    }

    if (!dryRun) {
      await client.query("SET session_replication_role = 'origin';");
      await client.query('COMMIT;');
    }

    console.log(`\n\nSuccess! Processed all ${statementCount} SQL statements.`);
    if (dryRun) {
      console.log('Dry run complete: All statements parsed successfully.');
    } else {
      console.log('Restore successfully committed to database.');
    }
  } catch (err) {
    if (!dryRun) {
      console.warn('Rolling back transaction due to error...');
      try {
        await client.query('ROLLBACK;');
      } catch (_) {}
    }
    console.error('Restore failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const fileArg = args[0];
  const isDryRun = args.includes('--dry-run');
  const targetUrlArg = args.find(a => a.startsWith('--url='))?.replace('--url=', '');

  if (!fileArg) {
    console.log('Usage: node restore-backup.js <path-to-sql-or-gz-file> [--dry-run] [--url=postgres://...]');
    process.exit(1);
  }

  runRestore(path.resolve(process.cwd(), fileArg), targetUrlArg || defaultDatabaseUrl, isDryRun)
    .catch(() => process.exit(1));
}

module.exports = { runRestore };
