"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../app.module");
const users_service_1 = require("../modules/users/users.service");
const auth_service_1 = require("../modules/auth/auth.service");
const prisma_service_1 = require("../prisma/prisma.service");
async function main() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const usersService = app.get(users_service_1.UsersService);
    const authService = app.get(auth_service_1.AuthService);
    const prisma = app.get(prisma_service_1.PrismaService);
    const email = 'test_engineer@example.com';
    const password = 'Password@123';
    await prisma.user.deleteMany({
        where: { email }
    });
    const role = await prisma.role.findUnique({
        where: { name: 'Service Engineer' }
    });
    if (!role) {
        console.error('Service Engineer role not found in DB!');
        await app.close();
        return;
    }
    console.log('Found Service Engineer role:', role);
    console.log('Creating test user...');
    const user = await usersService.create({
        full_name: 'Test Engineer',
        email,
        password,
        role_id: role.id,
        account_status: 'ACTIVE',
    });
    console.log('Created user:', user);
    console.log('Validating service engineer via authService...');
    const validatedUser = await authService.validateServiceEngineer(email, password);
    console.log('Validation result:', validatedUser);
    await prisma.user.deleteMany({
        where: { email }
    });
    await app.close();
}
main().catch((e) => {
    console.error(e);
});
//# sourceMappingURL=test-engineer-login.js.map