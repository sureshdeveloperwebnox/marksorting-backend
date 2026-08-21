import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting PushToken database cleanup...');

  // 1. Fetch all tokens ordered by updated_at desc
  const allTokens = await prisma.pushToken.findMany({
    orderBy: { updated_at: 'desc' },
  });

  console.log(`Total tokens before cleanup: ${allTokens.length}`);

  // Track unique tokens globally (a physical device token should belong to only ONE user - the latest one)
  const seenTokens = new Set<string>();
  // Track unique (user_id + device_type) so each user has only 1 active token per device type
  const seenUserDevice = new Set<string>();

  const idsToKeep = new Set<string>();
  const idsToDelete: string[] = [];

  for (const t of allTokens) {
    const trimmedToken = t.token.trim();
    const userDeviceKey = `${t.user_id}_${t.device_type}`;

    if (seenTokens.has(trimmedToken) || seenUserDevice.has(userDeviceKey)) {
      idsToDelete.push(t.id);
    } else {
      seenTokens.add(trimmedToken);
      seenUserDevice.add(userDeviceKey);
      idsToKeep.add(t.id);
    }
  }

  console.log(`Keeping ${idsToKeep.size} latest unique tokens.`);
  console.log(`Deleting ${idsToDelete.length} duplicate / obsolete tokens.`);

  if (idsToDelete.length > 0) {
    const deleteResult = await prisma.pushToken.deleteMany({
      where: { id: { in: idsToDelete } },
    });
    console.log(`Successfully deleted ${deleteResult.count} duplicate tokens from DB.`);
  }

  const remaining = await prisma.pushToken.findMany({
    select: {
      id: true,
      user_id: true,
      token: true,
      device_type: true,
      updated_at: true,
      user: { select: { full_name: true } },
    },
  });

  console.log('\nCLEANED PUSH TOKENS:');
  console.log(JSON.stringify(remaining, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
