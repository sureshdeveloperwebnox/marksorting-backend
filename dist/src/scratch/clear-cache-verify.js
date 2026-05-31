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
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const ioredis_1 = __importDefault(require("ioredis"));
const bcrypt = __importStar(require("bcrypt"));
const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
const redisConn = new ioredis_1.default({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
});
async function main() {
    const email = 'kator18328@mtupu.com';
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            console.log(`User ${email} not found.`);
            return;
        }
        console.log('User ID:', user.id);
        console.log('Password hash in DB:', user.password_hash);
        const keysToDelete = [
            `user:email:${email}`,
            `user:id:${user.id}`,
            `users:email:${email}`,
            `user_permissions:${user.id}`
        ];
        for (const key of keysToDelete) {
            const deleted = await redisConn.del(key);
            console.log(`Deleted Redis key ${key}: ${deleted}`);
        }
        const candidates = ['Vetri@123', 'NewVetri@123', 'admin123', 'vetri@123'];
        for (const cand of candidates) {
            const match = await bcrypt.compare(cand, user.password_hash);
            console.log(`Candidate "${cand}" vs DB hash: ${match ? 'MATCHES' : 'does NOT match'}`);
        }
    }
    catch (error) {
        console.error('Error:', error.message);
    }
    finally {
        await prisma.$disconnect();
        redisConn.disconnect();
    }
}
main();
//# sourceMappingURL=clear-cache-verify.js.map