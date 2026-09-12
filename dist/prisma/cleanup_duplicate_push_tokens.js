"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    console.log('Starting PushToken database cleanup...');
    const allTokens = await prisma.pushToken.findMany({
        orderBy: { updated_at: 'desc' },
    });
    console.log(`Total tokens before cleanup: ${allTokens.length}`);
    const seenTokens = new Set();
    const seenUserDevice = new Set();
    const idsToKeep = new Set();
    const idsToDelete = [];
    for (const t of allTokens) {
        const trimmedToken = t.token.trim();
        const userDeviceKey = `${t.user_id}_${t.device_type}`;
        if (seenTokens.has(trimmedToken) || seenUserDevice.has(userDeviceKey)) {
            idsToDelete.push(t.id);
        }
        else {
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
//# sourceMappingURL=cleanup_duplicate_push_tokens.js.map