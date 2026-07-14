"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../app.module");
const auth_service_1 = require("../modules/auth/auth.service");
const users_service_1 = require("../modules/users/users.service");
const prisma_service_1 = require("../prisma/prisma.service");
async function main() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const authService = app.get(auth_service_1.AuthService);
    const usersService = app.get(users_service_1.UsersService);
    const prisma = app.get(prisma_service_1.PrismaService);
    const email = 'test_rotation@example.com';
    const password = 'Password@123';
    await prisma.user.deleteMany({ where: { email } });
    const role = await prisma.role.findFirst({ where: { name: 'Super Admin' } });
    if (!role) {
        throw new Error('Role "Super Admin" not found in the database. Seed it first.');
    }
    const user = await usersService.create({
        full_name: 'Rotation Tester',
        email,
        password,
        role_id: role.id,
        account_status: 'ACTIVE',
    });
    console.log('User created. Attempting login...');
    const loginResult = await authService.login(user);
    let currentRefreshToken = loginResult.refresh_token;
    console.log('Initial Refresh Token:', currentRefreshToken.substring(0, 15) + '...');
    for (let i = 1; i <= 5; i++) {
        console.log(`\n--- Rotation Cycle ${i} ---`);
        try {
            const refreshResult = await authService.refresh(currentRefreshToken);
            const oldToken = currentRefreshToken;
            currentRefreshToken = refreshResult.refresh_token;
            console.log(`Success! New Refresh Token: ${currentRefreshToken.substring(0, 15)}...`);
            console.log('Testing reuse of old token in grace period...');
            const reuseResult = await authService.refresh(oldToken);
            console.log('Grace period reuse succeeded! Returned tokens match:', reuseResult.refresh_token === currentRefreshToken);
        }
        catch (e) {
            console.error(`Rotation cycle ${i} failed:`, e.message);
        }
    }
    await prisma.user.deleteMany({ where: { email } });
    await app.close();
}
main().catch(console.error);
//# sourceMappingURL=test-rotation.js.map