"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../app.module");
const users_service_1 = require("../modules/users/users.service");
const prisma_service_1 = require("../prisma/prisma.service");
const redis_service_1 = require("../redis/redis.service");
async function main() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const usersService = app.get(users_service_1.UsersService);
    const prisma = app.get(prisma_service_1.PrismaService);
    const redis = app.get(redis_service_1.RedisService);
    console.log('=== Active Roles in DB ===');
    const roles = await prisma.role.findMany();
    console.log(roles);
    console.log('\n=== Users in DB ===');
    const users = await prisma.user.findMany({
        include: { role: true }
    });
    for (const u of users) {
        console.log(`User: ${u.email} | Name: ${u.full_name} | Role: ${u.role?.name} | Status: ${u.account_status} | Deleted: ${u.deleted_at}`);
        const emailCacheKey = `user:email:${u.email}`;
        const cachedByEmail = await redis.getJson(emailCacheKey);
        console.log(`  Cached by email:`, cachedByEmail);
        const idCacheKey = `user:id:${u.id}`;
        const cachedById = await redis.getJson(idCacheKey);
        console.log(`  Cached by ID:`, cachedById);
    }
    await app.close();
}
main().catch((e) => {
    console.error(e);
});
//# sourceMappingURL=check-user.js.map