import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const jwtService = app.get(JwtService);

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  // 1. Fetch engineer details
  const user = await prisma.user.findUnique({
    where: { email: 'engineer@marksorting.com' },
    include: { role: true },
  });

  if (!user) {
    console.error('Engineer user not found!');
    await app.close();
    await prisma.$disconnect();
    await pool.end();
    return;
  }

  // 2. Fetch permissions
  const rolePermissions = await prisma.rolePermission.findMany({
    where: { role_id: user.role_id },
    include: { permission: true },
  });
  const permissions = rolePermissions.map((rp) => rp.permission.name);

  // 3. Generate token
  const payload = {
    email: user.email,
    sub: user.id,
    full_name: user.full_name,
    role: user.role.name,
    permissions: permissions,
  };

  const token = jwtService.sign(payload);

  console.log('\n==================================================');
  console.log('JWT TOKEN FOR SERVICE ENGINEER:');
  console.log(token);
  console.log('==================================================\n');

  // 4. Reset store return_status to 'Pending' so they can test PUT
  const storeId = 'e6b4e364-df38-44ab-8572-f30d10f25be4';
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (store) {
    await prisma.store.update({
      where: { id: storeId },
      data: {
        return_status: 'Pending',
        provider_name: null,
        invoice_number: null,
      },
    });
    console.log(`Reset store ${storeId} return_status back to 'Pending' for testing.`);
  } else {
    console.error(`Store ${storeId} not found in database.`);
  }

  await app.close();
  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
});
