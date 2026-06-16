"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const axios_1 = __importDefault(require("axios"));
const jwt = require('jsonwebtoken');
const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
const JWT_SECRET = process.env.JWT_SECRET || 'ihsa&29jw2kj1jasjkj#';
async function main() {
    const category = await prisma.expenseCategory.findFirst({
        where: { deleted_at: null },
    });
    const mill = await prisma.mill.findFirst({
        where: { deleted_at: null },
    });
    if (!category || !mill) {
        console.error('Seed data missing (category or mill)');
        return;
    }
    console.log('Using Category ID:', category.id);
    console.log('Using Mill ID:', mill.id);
    const sanjayId = '42d632ba-3221-4301-b8ce-52ff1e47f524';
    const token = jwt.sign({
        sub: sanjayId,
        email: 'sanjayprasath@gmail.com',
        full_name: 'Sanjay',
        role: 'Service Engineer',
        permissions: ['expenses.create', 'expenses.view', 'expenses.update'],
    }, JWT_SECRET, { expiresIn: '1h' });
    const authHeaders = {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    };
    const baseUrl = 'http://localhost:4000/api/v1/mobile/expenses';
    console.log('\n--- TEST 1: Create expense with no report linked (SHOULD SUCCEED) ---');
    try {
        const payload = {
            expense_type: 'MILL',
            visit_date: '2026-06-16',
            mill_id: mill.id,
            place: 'Coimbatore',
            expense_category_id: category.id,
            amount: 1500,
            remarks: 'Test manual visit expense',
        };
        const response = await axios_1.default.post(baseUrl, payload, authHeaders);
        console.log('SUCCESS: Status code:', response.status);
        console.log('Expense Number:', response.data.expense_number);
        console.log('Linked Report Type:', response.data.report_type);
    }
    catch (error) {
        console.error('FAILED:', error.response?.data || error.message);
    }
    console.log('\n--- TEST 2: Create expense with no report linked and missing visit_date (SHOULD FAIL) ---');
    try {
        const payload = {
            expense_type: 'MILL',
            mill_id: mill.id,
            place: 'Coimbatore',
            expense_category_id: category.id,
            amount: 1500,
            remarks: 'Test missing date',
        };
        await axios_1.default.post(baseUrl, payload, authHeaders);
        console.log('FAIL: Expected error, but succeeded');
    }
    catch (error) {
        console.log('SUCCESS: Got expected error:', error.response?.data?.message);
    }
    console.log('\n--- TEST 3: Create expense with no report linked and type MILL and missing mill_id (SHOULD FAIL) ---');
    try {
        const payload = {
            expense_type: 'MILL',
            visit_date: '2026-06-16',
            place: 'Coimbatore',
            expense_category_id: category.id,
            amount: 1500,
            remarks: 'Test missing mill',
        };
        await axios_1.default.post(baseUrl, payload, authHeaders);
        console.log('FAIL: Expected error, but succeeded');
    }
    catch (error) {
        console.log('SUCCESS: Got expected error:', error.response?.data?.message);
    }
    console.log('\n--- TEST 4: Create expense with type OTHERS and missing mill_id (SHOULD SUCCEED) ---');
    try {
        const payload = {
            expense_type: 'OTHERS',
            visit_date: '2026-06-16',
            place: 'Airport Terminal',
            expense_category_id: category.id,
            amount: 450,
            remarks: 'Airport parking',
        };
        const response = await axios_1.default.post(baseUrl, payload, authHeaders);
        console.log('SUCCESS: Status code:', response.status);
        console.log('Expense Number:', response.data.expense_number);
    }
    catch (error) {
        console.error('FAILED:', error.response?.data || error.message);
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=verify_api.js.map