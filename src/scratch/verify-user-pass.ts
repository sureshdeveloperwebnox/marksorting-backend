import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function verify() {
  const email = 'admin@marksorting.com';
  
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log(`User ${email} not found.`);
      return;
    }
    
    console.log('User found:', user.email);
    console.log('Password hash:', user.password_hash);
    
    // Check candidate passwords
    const candidates = ['password123', 'Vetri@123', 'NewVetri@123', 'admin123', 'undefined', 'null', '', 'kator18328@mtupu.com', 'vetri@123'];
    for (const cand of candidates) {
      const match = await bcrypt.compare(cand, user.password_hash);
      console.log(`Candidate "${cand}": ${match ? 'MATCHES' : 'does NOT match'}`);
    }

    // List latest resets status
    const resets = await prisma.passwordReset.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: 'desc' },
      take: 3,
    });
    console.log('Resets history:', JSON.stringify(resets, null, 2));

  } catch (err: any) {
    console.error('Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
