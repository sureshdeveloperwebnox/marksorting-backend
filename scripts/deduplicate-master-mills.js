const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

// 1. Load .env
const envPath = path.join(__dirname, '..', '.env');
const env = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = match[2] ? match[2].trim() : '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      env[match[1]] = value;
    }
  });
}

const connectionString = env.DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error('ERROR: DATABASE_URL not found in environment or .env');
  process.exit(1);
}

const isApply = process.argv.includes('--apply');
const isDryRun = !isApply || process.argv.includes('--dry-run');

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function deduplicateMasterMills() {
  console.log(`=== Master Mills Ref No Deduplication ===`);
  console.log(`Mode: ${isApply ? 'APPLY (Writing changes to database)' : 'DRY-RUN (Simulating only, no changes)'}\n`);

  // Find all ref_no with count > 1
  const duplicateGroups = await prisma.masterMill.groupBy({
    by: ['ref_no'],
    where: {
      deleted_at: null,
      ref_no: { not: null },
    },
    _count: { id: true },
    having: {
      id: { _count: { gt: 1 } },
    },
  });

  console.log(`Found ${duplicateGroups.length} duplicate Ref No groups.`);
  if (duplicateGroups.length === 0) {
    console.log('No duplicates found. Database is already clean.');
    return;
  }

  let totalRecordsMerged = 0;
  let totalRecordsSoftDeleted = 0;

  for (const group of duplicateGroups) {
    const refNo = group.ref_no;
    if (!refNo) continue;

    // Fetch all records for this ref_no
    const records = await prisma.masterMill.findMany({
      where: {
        deleted_at: null,
        ref_no: { equals: refNo, mode: 'insensitive' },
      },
      orderBy: { created_at: 'desc' },
    });

    if (records.length <= 1) continue;

    // Canonical record: pick the one with the most non-null fields, breaking ties with latest created_at
    const scoreRecord = (r) => {
      let score = 0;
      if (r.frame_no) score += 5;
      if (r.mc_model) score += 3;
      if (r.mfg_date) score += 3;
      if (r.installation_date) score += 3;
      if (r.invoice_date) score += 2;
      if (r.warranty_closing_date) score += 2;
      if (r.amc_starting_date) score += 2;
      if (r.mill_id) score += 4;
      if (r.phone_no) score += 1;
      if (r.place) score += 1;
      return score;
    };

    records.sort((a, b) => scoreRecord(b) - scoreRecord(a));
    const canonical = records[0];
    const duplicates = records.slice(1);

    // Merge non-null fields from duplicates into canonical
    const mergedUpdates = {};
    const fieldsToMerge = [
      'frame_no',
      'mc_model',
      'mfg_date',
      'installation_date',
      'invoice_date',
      'warranty_start_date',
      'warranty_years',
      'warranty_months',
      'warranty_closing_date',
      'amc_starting_date',
      'amc_closing_date',
      'amc_period',
      'amc_amount',
      'amc_particular',
      'all_warranty',
      'address',
      'place',
      'state',
      'phone_no',
      'mill_id',
    ];

    for (const dup of duplicates) {
      for (const field of fieldsToMerge) {
        if (!canonical[field] && dup[field] && !mergedUpdates[field]) {
          mergedUpdates[field] = dup[field];
        }
      }
    }

    totalRecordsMerged++;
    totalRecordsSoftDeleted += duplicates.length;

    if (isApply) {
      await prisma.$transaction(async (tx) => {
        // 1. Update canonical if there are merged fields
        if (Object.keys(mergedUpdates).length > 0) {
          await tx.masterMill.update({
            where: { id: canonical.id },
            data: { ...mergedUpdates, updated_at: new Date() },
          });
        }

        // 2. Soft delete redundant duplicate records
        const dupIds = duplicates.map((d) => d.id);
        await tx.masterMill.updateMany({
          where: { id: { in: dupIds } },
          data: { deleted_at: new Date() },
        });
      });
    }
  }

  console.log(`\n=== Deduplication Summary ===`);
  console.log(`Unique Ref No groups processed: ${totalRecordsMerged}`);
  console.log(`Redundant records ${isApply ? 'soft-deleted' : 'to be soft-deleted'}: ${totalRecordsSoftDeleted}`);
  if (!isApply) {
    console.log(`\nTo apply these changes permanently, run:`);
    console.log(`node scripts/deduplicate-master-mills.js --apply`);
  } else {
    console.log(`\nChanges applied successfully!`);
  }
}

deduplicateMasterMills()
  .catch((err) => {
    console.error('Fatal error during deduplication:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
