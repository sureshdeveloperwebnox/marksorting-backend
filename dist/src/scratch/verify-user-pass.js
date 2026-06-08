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
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const bcrypt = __importStar(require("bcrypt"));
const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
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
        const candidates = ['password123', 'Admin@1234', 'Vetri@123', 'NewVetri@123', 'admin123', 'undefined', 'null', '', 'kator18328@mtupu.com', 'vetri@123'];
        for (const cand of candidates) {
            const match = await bcrypt.compare(cand, user.password_hash);
            console.log(`Candidate "${cand}": ${match ? 'MATCHES' : 'does NOT match'}`);
        }
        const resets = await prisma.passwordReset.findMany({
            where: { user_id: user.id },
            orderBy: { created_at: 'desc' },
            take: 3,
        });
        console.log('Resets history:', JSON.stringify(resets, null, 2));
    }
    catch (err) {
        console.error('Error:', err.message);
    }
    finally {
        await prisma.$disconnect();
    }
}
verify();
//# sourceMappingURL=verify-user-pass.js.map