import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../modules/users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const prisma = app.get(PrismaService);
  const redis = app.get(RedisService);

  console.log('=== Active Roles in DB ===');
  const roles = await prisma.role.findMany();
  console.log(roles);

  console.log('\n=== Users in DB ===');
  const users = await prisma.user.findMany({
    include: { role: true }
  });
  
  for (const u of users) {
    console.log(`User: ${u.email} | Name: ${u.full_name} | Role: ${u.role?.name} | Status: ${u.account_status} | Deleted: ${u.deleted_at}`);
    
    // Check Redis cache for this user
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
