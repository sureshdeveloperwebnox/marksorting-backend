"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const axios_1 = __importDefault(require("axios"));
const crypto = __importStar(require("crypto"));
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
function base64Url(str) {
    return Buffer.from(str)
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}
function createJwt(payload, secret) {
    const header = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = base64Url(JSON.stringify(header));
    const encodedPayload = base64Url(JSON.stringify(payload));
    const signature = crypto
        .createHmac('sha256', secret)
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
    return `${encodedHeader}.${encodedPayload}.${signature}`;
}
async function main() {
    console.log('--- 1. RETRIEVING SUPER ADMIN USER FROM DB ---');
    const adminUser = await prisma.user.findFirst({
        where: {
            account_status: 'ACTIVE',
            deleted_at: null,
            role: {
                name: { in: ['SUPER_ADMIN', 'Super Admin', 'Admin', 'admin'], mode: 'insensitive' }
            }
        },
        include: { role: true }
    });
    if (!adminUser) {
        console.error('No admin user found.');
        return;
    }
    console.log(`Using Admin: ${adminUser.full_name} (${adminUser.email}), Role: ${adminUser.role?.name}`);
    const secret = 'super-secret-key-change-me';
    const now = Math.floor(Date.now() / 1000);
    const token = createJwt({
        sub: adminUser.id,
        email: adminUser.email,
        full_name: adminUser.full_name,
        role: adminUser.role?.name || 'SUPER_ADMIN',
        permissions: ['*'],
        iat: now,
        exp: now + 86400,
    }, secret);
    console.log('\n--- 2. CALLING LIVE BROADCAST API (PORT 4010) ---');
    try {
        const broadcastRes = await axios_1.default.post('http://localhost:4010/api/v1/notifications/broadcast', {
            title: 'SuperAdmin Official Broadcast',
            message: 'Live test: Verifying notification delivery to Service Engineers on closed app',
            type: 'BROADCAST',
            target: 'ROLE',
            role_names: ['Service Engineer'],
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });
        console.log('API Status:', broadcastRes.status);
        console.log('API Response:', broadcastRes.data);
        console.log('\n🎉 SUCCESS: Live Broadcast API executed completely with 0 errors!');
    }
    catch (err) {
        console.error('Broadcast API Error:', err?.response?.status, err?.response?.data || err.message);
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=test_broadcast_api.js.map