const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config();

function base64Url(strOrBuffer) {
  const base64 = (Buffer.isBuffer(strOrBuffer) ? strOrBuffer : Buffer.from(strOrBuffer)).toString('base64');
  return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function signJwt(payload, secret) {
  const header = { alg: "HS256", typ: "JWT" };
  const tokenInput = base64Url(JSON.stringify(header)) + "." + base64Url(JSON.stringify(payload));
  const signature = crypto.createHmac('sha256', secret).update(tokenInput).digest();
  return tokenInput + "." + base64Url(signature);
}

async function main() {
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
    // Add standard JWT claims (expiration in 7 days)
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
  };

  const secret = process.env.JWT_SECRET || 'super-secret-key-change-me';
  const token = signJwt(payload, secret);

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

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
});
