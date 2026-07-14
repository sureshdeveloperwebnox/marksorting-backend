"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    console.log('=== Expense Categories ===\n');
    const categories = await prisma.expenseCategory.findMany({
        where: { deleted_at: null },
        orderBy: { name: 'asc' }
    });
    categories.forEach(c => console.log(`- ${c.name} [${c.id}]`));
    console.log('\n=== Recent Expenses with details ===\n');
    const expenses = await prisma.expense.findMany({
        take: 5,
        orderBy: { created_at: 'desc' },
        where: { deleted_at: null },
        include: {
            expenseCategory: { select: { id: true, name: true } },
            expense_items: {
                include: { expenseCategory: { select: { id: true, name: true } } }
            }
        }
    });
    expenses.forEach(e => {
        console.log(`Expense: ${e.expense_number}`);
        console.log(`  expense_type: ${e.expense_type}`);
        console.log(`  others (description): ${e.others}`);
        console.log(`  remarks: ${e.remarks}`);
        console.log(`  root expenseCategory: ${e.expenseCategory?.name || 'none'}`);
        console.log(`  expense_items:`);
        e.expense_items.forEach(item => {
            console.log(`    - Category: ${item.expenseCategory?.name}, Amount: ${item.amount}, Remarks: ${item.remarks}`);
        });
        console.log('--------------------------------------------------');
    });
}
main().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=check-expenses-details.js.map