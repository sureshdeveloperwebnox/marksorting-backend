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
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const ioredis_1 = __importDefault(require("ioredis"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
async function main() {
    const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new adapter_pg_1.PrismaPg(pool);
    const prisma = new client_1.PrismaClient({ adapter });
    console.log('Cleaning up mills linked to dummy customer matching mill name...');
    const millsWithSameCustomer = await prisma.mill.findMany({
        where: {
            customer_id: { not: null },
            deleted_at: null,
        },
        include: {
            customer: true,
        },
    });
    const dummyMatches = millsWithSameCustomer.filter((m) => m.customer && m.customer.name.trim().toLowerCase() === m.name.trim().toLowerCase());
    console.log(`Found ${dummyMatches.length} mills linked to dummy customer named after the mill.`);
    for (const m of dummyMatches) {
        if (!m.customer)
            continue;
        const customerId = m.customer.id;
        await prisma.mill.update({
            where: { id: m.id },
            data: { customer_id: null },
        });
        try {
            await prisma.customer.update({
                where: { id: customerId },
                data: { deleted_at: new Date() },
            });
            console.log(`Unlinked and soft-deleted dummy customer "${m.customer.name}" for Mill "${m.name}".`);
        }
        catch (err) {
            console.log(`Unlinked dummy customer "${m.customer.name}" from Mill "${m.name}".`);
        }
    }
    try {
        const redis = new ioredis_1.default({
            host: process.env.REDIS_HOST || 'localhost',
            port: Number(process.env.REDIS_PORT) || 6379,
        });
        await redis.flushdb();
        console.log('Redis cache flushed.');
        redis.disconnect();
    }
    catch (err) {
        console.log('Redis error:', err);
    }
}
main().catch(console.error);
//# sourceMappingURL=cleanup_dummy_customers.js.map