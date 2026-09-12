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
    console.log('Seeding log retention policies...\n');
    const policies = [
        {
            log_type: 'activity_logs',
            retention_days: 90,
            archive_enabled: true,
            archive_after_days: 30,
            delete_after_days: 365,
        },
        {
            log_type: 'audit_trails',
            retention_days: 2555,
            archive_enabled: true,
            archive_after_days: 365,
            delete_after_days: null,
        },
        {
            log_type: 'security_logs',
            retention_days: 365,
            archive_enabled: true,
            archive_after_days: 90,
            delete_after_days: 2555,
        },
        {
            log_type: 'api_logs',
            retention_days: 30,
            archive_enabled: true,
            archive_after_days: 7,
            delete_after_days: 90,
        },
        {
            log_type: 'error_logs',
            retention_days: 180,
            archive_enabled: true,
            archive_after_days: 30,
            delete_after_days: 365,
        },
        {
            log_type: 'job_logs',
            retention_days: 90,
            archive_enabled: true,
            archive_after_days: 30,
            delete_after_days: 180,
        },
        {
            log_type: 'notification_logs',
            retention_days: 90,
            archive_enabled: true,
            archive_after_days: 30,
            delete_after_days: 365,
        },
        {
            log_type: 'websocket_logs',
            retention_days: 30,
            archive_enabled: true,
            archive_after_days: 7,
            delete_after_days: 90,
        },
    ];
    for (const policy of policies) {
        await prisma.logRetentionPolicy.upsert({
            where: { log_type: policy.log_type },
            update: policy,
            create: policy,
        });
        console.log(`✅ Policy created: ${policy.log_type} (${policy.retention_days} days retention)`);
    }
    console.log('\n✅ Log retention policies seeded successfully!');
}
main()
    .catch((e) => {
    console.error('Error seeding retention policies:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed-retention-policies.js.map