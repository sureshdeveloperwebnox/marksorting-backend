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
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    console.log('Starting store_number backfill for existing store records...');
    const stores = await prisma.store.findMany({
        orderBy: { created_at: 'asc' },
        select: { id: true, created_at: true, store_number: true },
    });
    console.log(`Found ${stores.length} store records in database.`);
    const dayMap = new Map();
    let updatedCount = 0;
    for (const s of stores) {
        const d = new Date(s.created_at || new Date());
        const dateStr = d.toISOString().slice(0, 10).replace(/-/g, '');
        const currentSeq = (dayMap.get(dateStr) || 0) + 1;
        dayMap.set(dateStr, currentSeq);
        const generatedNumber = `ST-${dateStr}-${currentSeq}`;
        if (!s.store_number) {
            await prisma.store.update({
                where: { id: s.id },
                data: { store_number: generatedNumber },
            });
            updatedCount++;
        }
    }
    console.log(`Successfully backfilled ${updatedCount} store records with unique store_numbers!`);
}
main()
    .catch((e) => {
    console.error('Error during backfill:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=backfill_store_numbers.js.map