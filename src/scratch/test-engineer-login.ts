import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../modules/users/users.service';
import { AuthService } from '../modules/auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const authService = app.get(AuthService);
  const prisma = app.get(PrismaService);

  const email = 'test_engineer@example.com';
  const password = 'Password@123';

  // 1. Delete user if exists
  await prisma.user.deleteMany({
    where: { email }
  });

  // 2. Find Service Engineer role
  const role = await prisma.role.findUnique({
    where: { name: 'Service Engineer' }
  });
  if (!role) {
    console.error('Service Engineer role not found in DB!');
    await app.close();
    return;
  }
  console.log('Found Service Engineer role:', role);

  // 3. Create user using usersService (as the admin panel/controller does)
  console.log('Creating test user...');
  const user = await usersService.create({
    full_name: 'Test Engineer',
    email,
    password,
    role_id: role.id,
    account_status: 'ACTIVE',
  });

  console.log('Created user:', user);

  // 4. Test validateServiceEngineer
  console.log('Validating service engineer via authService...');
  const validatedUser = await authService.validateServiceEngineer(email, password);
  console.log('Validation result:', validatedUser);

  // 5. Clean up
  await prisma.user.deleteMany({
    where: { email }
  });

  await app.close();
}

main().catch((e) => {
  console.error(e);
});
