"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const axios_1 = __importDefault(require("axios"));
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const ioredis_1 = __importDefault(require("ioredis"));
const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
const redisConn = new ioredis_1.default({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
});
async function runTest() {
    const email = 'kator18328@mtupu.com';
    const backendUrl = 'http://localhost:4000/api/v1';
    console.log(`Starting password reset end-to-end test for ${email}...`);
    try {
        const userBefore = await prisma.user.findUnique({ where: { email } });
        if (!userBefore) {
            console.error(`User ${email} not found in database!`);
            return;
        }
        const oldHash = userBefore.password_hash;
        console.log('Initial password hash:', oldHash);
        console.log('1. Calling forgot-password endpoint...');
        const forgotRes = await axios_1.default.post(`${backendUrl}/auth/forgot-password`, {
            email,
        });
        console.log('Forgot password response:', forgotRes.data);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        console.log('2. Querying Redis for queued mail job...');
        const jobKeys = await redisConn.keys('bull:mail:*');
        console.log(`Found ${jobKeys.length} keys in Redis for mail queue.`);
        let rawToken = null;
        for (const key of jobKeys) {
            if (key.match(/^bull:mail:\d+$/)) {
                const jobData = await redisConn.hgetall(key);
                if (jobData && jobData.data) {
                    const parsed = JSON.parse(jobData.data);
                    if (parsed.to === email) {
                        console.log('Found mail job for user. Subject:', parsed.subject);
                        const match = parsed.html.match(/token=([a-f0-9]+)/);
                        if (match) {
                            rawToken = match[1];
                            console.log('Extracted raw token from email HTML:', rawToken);
                            break;
                        }
                    }
                }
            }
        }
        if (!rawToken) {
            console.error('Could not find queued mail job or extract token!');
            return;
        }
        console.log('3. Calling reset-password endpoint...');
        const resetRes = await axios_1.default.post(`${backendUrl}/auth/reset-password`, {
            token: rawToken,
            password: 'NewVetri@123',
        });
        console.log('Reset password response:', resetRes.data);
        const userAfter = await prisma.user.findUnique({ where: { email } });
        const newHash = userAfter?.password_hash;
        console.log('New password hash:', newHash);
        if (newHash !== oldHash) {
            console.log('SUCCESS: Password hash changed in database!');
        }
        else {
            console.error('FAILURE: Password hash in database remains unchanged!');
        }
    }
    catch (error) {
        console.error('Error during test:', error.response?.data || error.message);
    }
    finally {
        await prisma.$disconnect();
        redisConn.disconnect();
    }
}
runTest();
//# sourceMappingURL=test-reset-flow-redis.js.map