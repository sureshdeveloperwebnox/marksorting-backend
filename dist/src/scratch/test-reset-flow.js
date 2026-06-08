"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
async function runTest() {
    const email = 'kator18328@mtupu.com';
    const backendUrl = 'http://localhost:4000/api/v1';
    console.log(`Starting password reset test for ${email}...`);
    try {
        console.log('1. Calling forgot-password endpoint...');
        const forgotRes = await axios_1.default.post(`${backendUrl}/auth/forgot-password`, {
            email,
        });
        console.log('Forgot password response:', forgotRes.data);
    }
    catch (error) {
        console.error('Error during test:', error.response?.data || error.message);
    }
    finally {
        await prisma.$disconnect();
    }
}
runTest();
//# sourceMappingURL=test-reset-flow.js.map