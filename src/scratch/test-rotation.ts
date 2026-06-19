import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AuthService } from '../modules/auth/auth.service';
import { UsersService } from '../modules/users/users.service';
import { PrismaService } from '../prisma/prisma.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const authService = app.get(AuthService);
  const usersService = app.get(UsersService);
  const prisma = app.get(PrismaService);

  const email = 'test_rotation@example.com';
  const password = 'Password@123';

  // 1. Setup user
  await prisma.user.deleteMany({ where: { email } });
  const role = await prisma.role.findFirst({ where: { name: 'Super Admin' } });

  // findFirst returns null if no matching role exists — guard against that.
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

  // 2. Perform rotation 5 times sequentially
  for (let i = 1; i <= 5; i++) {
    console.log(`\n--- Rotation Cycle ${i} ---`);
    try {
      const refreshResult = await authService.refresh(currentRefreshToken);
      const oldToken = currentRefreshToken;
      currentRefreshToken = refreshResult.refresh_token;
      console.log(`Success! New Refresh Token: ${currentRefreshToken.substring(0, 15)}...`);

      // Test reuse grace period immediately (within 60s)
      console.log('Testing reuse of old token in grace period...');
      const reuseResult = await authService.refresh(oldToken);
      console.log('Grace period reuse succeeded! Returned tokens match:', reuseResult.refresh_token === currentRefreshToken);
    } catch (e: any) {
      console.error(`Rotation cycle ${i} failed:`, e.message);
    }
  }

  // 3. Test reuse after grace period (simulate by waiting or manually editing rotatedAt in Redis)
  // Let's clean up
  await prisma.user.deleteMany({ where: { email } });
  await app.close();
}

main().catch(console.error);
