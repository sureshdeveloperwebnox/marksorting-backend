import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { AuthService } from '../modules/auth/auth.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import IORedis from 'ioredis';
import * as bcrypt from 'bcrypt';
import axios from 'axios';

const redisConn = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
});

async function main() {
  const email = 'kator18328@mtupu.com';
  const backendUrl = 'http://localhost:4000/api/v1';

  try {
    // 1. Trigger forgot password via API to queue email
    console.log('1. Triggering forgot password via HTTP...');
    await axios.post(`${backendUrl}/auth/forgot-password`, { email });
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // 2. Fetch the raw token from Redis
    console.log('2. Fetching token from Redis...');
    const keys = await redisConn.keys('bull:mail:*');
    let rawToken: string | null = null;
    for (const key of keys) {
      if (key.match(/^bull:mail:\d+$/)) {
        const hdata = await redisConn.hgetall(key);
        if (hdata && hdata.data) {
          const parsed = JSON.parse(hdata.data);
          if (parsed.to === email) {
            const match = parsed.html.match(/token=([a-f0-9]+)/);
            if (match) {
              rawToken = match[1];
              break;
            }
          }
        }
      }
    }

    if (!rawToken) {
      console.error('Failed to extract token from Redis!');
      return;
    }
    console.log('Extracted token:', rawToken);

    // 3. Bootstrap NestJS application context
    console.log('3. Bootstrapping NestJS...');
    const app = await NestFactory.createApplicationContext(AppModule);
    const authService = app.get(AuthService);
    const prisma = app.get(PrismaService);

    // 4. Call resetPassword directly on the service
    console.log('4. Calling authService.resetPassword directly...');
    const targetPassword = 'NewVetri@123';
    await authService.resetPassword(rawToken, targetPassword);
    console.log('Direct resetPassword call completed.');

    // 5. Query user from database and verify the hash
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.error('User not found in database!');
      await app.close();
      return;
    }

    console.log('Updated user hash in database:', user.password_hash);
    const matches = await bcrypt.compare(targetPassword, user.password_hash);
    console.log(
      `Bcrypt check for password "${targetPassword}" vs DB hash: ${matches ? 'MATCHES' : 'does NOT match'}`,
    );

    await app.close();
  } catch (error: any) {
    console.error('Error during direct test:', error.message);
  } finally {
    redisConn.disconnect();
  }
}

main();
