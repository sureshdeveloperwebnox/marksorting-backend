import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany({
    include: { role: true }
  });
  console.log('USERS:', users.map(u => ({ id: u.id, email: u.email, role: u.role?.name, status: u.account_status })));
  
  const technicians = await prisma.technician.findMany();
  console.log('TECHNICIANS:', technicians);
  
  const roles = await prisma.role.findMany();
  console.log('ROLES:', roles.map(r => ({ id: r.id, name: r.name })));

  try {
    const serviceReports = await prisma.serviceReport.findMany({
      include: {
        mill: { select: { id: true, name: true } },
        serviceCategory: { select: { id: true, name: true } },
        technicians: { include: { technician: { select: { id: true, full_name: true } } } },
      }
    });
    console.log('SERVICE REPORTS:', serviceReports);
  } catch (error) {
    console.error('SERVICE REPORTS ERROR:', error);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

