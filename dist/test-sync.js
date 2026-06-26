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
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
dotenv.config({ path: path.join(__dirname, '.env') });
const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    console.log('Running sync for all Service Reports...');
    const reports = await prisma.serviceReport.findMany({
        where: { deleted_at: null },
        include: {
            mill: {
                include: {
                    customer: true,
                }
            }
        }
    });
    for (const r of reports) {
        const millId = r.mill_id;
        const frameNo = r.serial_or_frame_no;
        const mcModel = r.machine_model;
        const installationDate = r.machine_installation_date;
        const place = r.place;
        const mill = r.mill;
        if (!mill) {
            console.log(`Report ${r.report_number} has no linked mill, skipping.`);
            continue;
        }
        try {
            const orConditions = [
                { mill_id: millId },
            ];
            if (frameNo && frameNo.trim()) {
                orConditions.push({
                    frame_no: { equals: frameNo.trim(), mode: 'insensitive' },
                });
            }
            const existing = await prisma.masterMill.findFirst({
                where: {
                    deleted_at: null,
                    type: 'Service',
                    OR: orConditions,
                },
            });
            if (existing) {
                const updates = {};
                if (frameNo && frameNo.trim() && existing.frame_no !== frameNo.trim())
                    updates.frame_no = frameNo.trim();
                if (mcModel && mcModel.trim() && existing.mc_model !== mcModel.trim())
                    updates.mc_model = mcModel.trim();
                if (installationDate && !existing.installation_date)
                    updates.installation_date = installationDate;
                if (place && place.trim() && existing.place !== place.trim())
                    updates.place = place.trim();
                if (existing.mill_id !== millId)
                    updates.mill_id = millId;
                if (existing.type !== 'Installation')
                    updates.type = 'Service';
                if (Object.keys(updates).length > 0) {
                    const updated = await prisma.masterMill.update({
                        where: { id: existing.id },
                        data: updates,
                    });
                    console.log(`[UPDATED] Report ${r.report_number} -> MasterMill ID ${updated.id}`);
                }
                else {
                    console.log(`[NO UPDATE NEEDED] Report ${r.report_number} -> MasterMill ID ${existing.id}`);
                }
            }
            else {
                const fallbackInvoiceNo = `INV-SR-${mill.ref_no || millId.slice(0, 8)}-${Date.now()}`;
                const created = await prisma.masterMill.create({
                    data: {
                        invoice_no: fallbackInvoiceNo,
                        ref_no: mill.ref_no || undefined,
                        frame_no: frameNo?.trim() || undefined,
                        mc_model: mcModel?.trim() || undefined,
                        installation_date: installationDate || undefined,
                        address: mill.address || undefined,
                        place: place?.trim() || mill.place || undefined,
                        phone_no: mill.phone || undefined,
                        mill_id: millId,
                        status: 'ACTIVE',
                        type: 'Service',
                    },
                });
                console.log(`[CREATED NEW] Report ${r.report_number} -> MasterMill ID ${created.id}, Invoice ${created.invoice_no}`);
            }
        }
        catch (error) {
            console.error(`[ERROR] Report ${r.report_number} sync failed:`, error);
        }
    }
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=test-sync.js.map