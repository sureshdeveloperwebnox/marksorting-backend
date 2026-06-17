import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function testDateFilter(dateFrom?: string, dateTo?: string) {
  const where: any = { deleted_at: null };

  if (dateFrom || dateTo) {
    where.visit_date = {};
    if (dateFrom) {
      const [fy, fm, fd] = dateFrom.split('-').map(Number);
      const fromDate = new Date(fy, fm - 1, fd, 0, 0, 0, 0);
      where.visit_date.gte = fromDate;
    }
    if (dateTo) {
      const [ty, tm, td] = dateTo.split('-').map(Number);
      const toDate = new Date(ty, tm - 1, td, 23, 59, 59, 999);
      where.visit_date.lte = toDate;
    }
  }

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      select: {
        id: true,
        expense_number: true,
        visit_date: true,
      },
      take: 5,
      orderBy: { visit_date: 'desc' },
    }),
    prisma.expense.count({ where }),
  ]);

  return { expenses, total };
}

async function main() {
  console.log('--- TEST 1: No Date Filters ---');
  const res1 = await testDateFilter();
  console.log('Total expenses:', res1.total);
  console.log('Sample expenses:', res1.expenses);

  console.log('\n--- TEST 2: With Date Filters (2026-06-01 to 2026-06-17) ---');
  const res2 = await testDateFilter('2026-06-01', '2026-06-17');
  console.log('Total filtered expenses:', res2.total);
  console.log('Filtered expenses:', res2.expenses);
  
  // Verify that all returned elements fall in the range
  const start = new Date(2026, 5, 1, 0, 0, 0, 0);
  const end = new Date(2026, 5, 17, 23, 59, 59, 999);
  
  let valid = true;
  for (const exp of res2.expenses) {
    const vd = new Date(exp.visit_date);
    if (vd < start || vd > end) {
      valid = false;
      console.error(`Invalid visit_date for expense ${exp.expense_number}: ${exp.visit_date}`);
    }
  }
  
  if (valid) {
    console.log('\nVerification success: All returned expenses fall in the specified date range.');
  } else {
    console.error('\nVerification failed: Some expenses fall outside the specified range.');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
