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
    console.log('Finding all soft-deleted users...');
    const deletedUsers = await prisma.user.findMany({
        where: {
            deleted_at: { not: null }
        }
    });
    console.log(`Found ${deletedUsers.length} soft-deleted users.`);
    for (const user of deletedUsers) {
        const timestamp = Date.now();
        const newEmail = user.email.includes('_deleted_')
            ? user.email
            : `${user.email}_deleted_${timestamp}`;
        const newPhone = user.phone_number
            ? (user.phone_number.includes('_deleted_') ? user.phone_number : `${user.phone_number}_deleted_${timestamp}`)
            : null;
        console.log(`Renaming user ${user.id}: ${user.email} -> ${newEmail}`);
        await prisma.user.update({
            where: { id: user.id },
            data: {
                email: newEmail,
                phone_number: newPhone
            }
        });
        const technician = await prisma.technician.findUnique({
            where: { id: user.id }
        });
        if (technician) {
            console.log(`Renaming technician ${technician.id}: ${technician.email} -> ${newEmail}`);
            await prisma.technician.update({
                where: { id: technician.id },
                data: {
                    email: newEmail,
                    phone: newPhone
                }
            });
        }
    }
    console.log('Migration complete!');
}
main().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=rename_deleted_users.js.map