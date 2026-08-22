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
const prisma_service_1 = require("./prisma/prisma.service");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
async function main() {
    const prisma = new prisma_service_1.PrismaService();
    await prisma.$connect();
    const testMills = await prisma.mill.findMany({
        where: {
            name: { startsWith: 'Mill Test' },
        },
        select: { id: true, name: true },
    });
    console.log('Found dummy test mills:', testMills.length);
    const deletedMM = await prisma.masterMill.deleteMany({
        where: {
            OR: [
                { ref_no: { in: Array.from({ length: 35 }, (_, i) => `REF-001${11 + i}`) }, mill: { name: { startsWith: 'Mill Test' } } },
                { mill_id: { in: testMills.map(m => m.id) } },
            ],
        },
    });
    console.log('Deleted dummy MasterMill records:', deletedMM.count);
    const deletedMills = await prisma.mill.deleteMany({
        where: {
            id: { in: testMills.map(m => m.id) },
        },
    });
    console.log('Deleted dummy Mill records:', deletedMills.count);
    const deletedCustomers = await prisma.customer.deleteMany({
        where: {
            name: { startsWith: 'Customer 11' },
        },
    });
    console.log('Deleted dummy Customer records:', deletedCustomers.count);
    await prisma.$disconnect();
}
main().catch(console.error);
//# sourceMappingURL=cleanup_test_records.js.map