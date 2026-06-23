const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const http = require('http');
const Redis = require('ioredis');

// Parse .env manually
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});

const connectionString = env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Simple JWT generation using jsonwebtoken
// Let's see if we can use Node's crypto or if we can require jsonwebtoken or @nestjs/jwt
const jwt = require('jsonwebtoken');

function get(url, token) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    http.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  try {
    // 1. Get an active user
    const user = await prisma.user.findFirst({
      where: { account_status: 'ACTIVE', deleted_at: null },
      include: { role: true }
    });

    if (!user) {
      console.error("No active user found!");
      return;
    }

    console.log(`Generating token for user: ${user.email}, Role: ${user.role.name}`);

    // payload structure used in backend
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role.name,
      full_name: user.full_name
    };

    const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '1d' });

    // 2. Query stats API before clearing cache
    let statsRes = await get('http://localhost:4000/api/v1/master-mills/stats', token);
    console.log("Stats Response (before cache clear):", statsRes.body);

    // 3. Clear Redis cache
    const redis = new Redis({
      host: env.REDIS_HOST || 'localhost',
      port: env.REDIS_PORT ? parseInt(env.REDIS_PORT) : 6379,
      password: env.REDIS_PASSWORD || undefined
    });

    const keys = await redis.keys('*master_mills*');
    console.log("Found master mills keys in Redis:", keys);
    if (keys.length > 0) {
      await redis.del(keys);
      console.log("Deleted master mills cache keys from Redis.");
    }

    // 4. Query stats API after clearing cache
    statsRes = await get('http://localhost:4000/api/v1/master-mills/stats', token);
    console.log("Stats Response (after cache clear):", statsRes.body);

    await redis.disconnect();
  } catch (error) {
    console.error("Error in script:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
