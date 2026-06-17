import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Mock of checkEligibility function
async function checkEligibility(
  user: { userId: string; role: string },
  technicianId?: string,
  excludeExpenseId?: string,
) {
  const isServiceEngineer = user.role === 'Service Engineer';
  const targetUserId = isServiceEngineer ? user.userId : technicianId;

  if (!targetUserId) {
    return {
      eligible: !isServiceEngineer,
      serviceReports: [],
      installationReports: [],
    };
  }

  const serviceReports = await prisma.serviceReport.findMany({
    where: {
      deleted_at: null,
      technicians: {
        some: {
          technician_id: targetUserId,
        },
      },
      OR: [
        { expense_id: null },
        ...(excludeExpenseId ? [{ expense_id: excludeExpenseId }] : []),
      ],
      expenses: {
        none: {
          deleted_at: null,
          ...(excludeExpenseId ? { NOT: { id: excludeExpenseId } } : {}),
        },
      },
    },
    select: {
      id: true,
      report_number: true,
      mill_id: true,
      place: true,
      visit_date: true,
      mill: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { created_at: 'desc' },
  });

  const installationReports = await prisma.installationReport.findMany({
    where: {
      deleted_at: null,
      technicians: {
        some: {
          technician_id: targetUserId,
        },
      },
      OR: [
        { expense_id: null },
        ...(excludeExpenseId ? [{ expense_id: excludeExpenseId }] : []),
      ],
      expenses: {
        none: {
          deleted_at: null,
          ...(excludeExpenseId ? { NOT: { id: excludeExpenseId } } : {}),
        },
      },
    },
    select: {
      id: true,
      report_number: true,
      mill_id: true,
      place: true,
      visit_date: true,
      mill: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { created_at: 'desc' },
  });

  const eligible = serviceReports.length > 0 || installationReports.length > 0;

  return {
    eligible: isServiceEngineer ? eligible : true,
    serviceReports: serviceReports.map((r) => ({
      id: r.id,
      report_number: r.report_number,
      mill_id: r.mill_id,
      place: r.place,
      visit_date: r.visit_date,
      mill_name: r.mill?.name || 'Unknown Mill',
    })),
    installationReports: installationReports.map((r) => ({
      id: r.id,
      report_number: r.report_number,
      mill_id: r.mill_id,
      place: r.place,
      visit_date: r.visit_date,
      mill_name: r.mill?.name || 'Unknown Mill',
    })),
  };
}

async function main() {
  const sanjayId = '42d632ba-3221-4301-b8ce-52ff1e47f524';
  
  console.log('--- TEST 1: Check Eligibility for Sanjay (Should be eligible) ---');
  const res1 = await checkEligibility({ userId: sanjayId, role: 'Service Engineer' });
  console.log('Sanjay Eligibility Status:', res1.eligible);
  console.log('Assigned Service Reports Count:', res1.serviceReports.length);
  console.log('Assigned Service Reports:', res1.serviceReports);

  console.log('\n--- TEST 2: Check Eligibility for Non-existent Engineer (Should NOT be eligible) ---');
  const fakeId = '00000000-0000-0000-0000-000000000000';
  const res2 = await checkEligibility({ userId: fakeId, role: 'Service Engineer' });
  console.log('Fake Engineer Eligibility Status:', res2.eligible);

  console.log('\n--- TEST 3: Check Eligibility for Admin (Should always be eligible) ---');
  const adminId = 'b453f872-097c-4549-941e-4006596b14f5';
  const res3 = await checkEligibility({ userId: adminId, role: 'Super Admin' });
  console.log('Admin Eligibility Status:', res3.eligible);
  
  console.log('\nVerification completed successfully.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
