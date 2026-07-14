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
    console.log('Fetching recent Notification Logs from database...\n');
    const count = await prisma.notificationLog.count();
    console.log(`Total notification logs: ${count}`);
    const logs = await prisma.notificationLog.findMany({
        orderBy: { sent_at: 'desc' },
        take: 50
    });
    console.log('\nRecent notification logs details:');
    logs.forEach(log => {
        console.log(`  - [${log.sent_at?.toISOString() || 'N/A'}] ` +
            `Type: ${log.notification_type}, ` +
            `Channel: ${log.channel}, ` +
            `Status: ${log.status}, ` +
            `Provider Message ID (Report ID): ${log.provider_message_id}, ` +
            `Error: ${log.error_message || 'None'}`);
    });
}
main().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=check-notification-logs.js.map