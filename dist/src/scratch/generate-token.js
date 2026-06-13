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
const core_1 = require("@nestjs/core");
const app_module_1 = require("../app.module");
const jwt_1 = require("@nestjs/jwt");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
async function main() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const jwtService = app.get(jwt_1.JwtService);
    const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new adapter_pg_1.PrismaPg(pool);
    const prisma = new client_1.PrismaClient({ adapter });
    const user = await prisma.user.findUnique({
        where: { email: 'engineer@marksorting.com' },
        include: { role: true },
    });
    if (!user) {
        console.error('Engineer user not found!');
        await app.close();
        await prisma.$disconnect();
        await pool.end();
        return;
    }
    const rolePermissions = await prisma.rolePermission.findMany({
        where: { role_id: user.role_id },
        include: { permission: true },
    });
    const permissions = rolePermissions.map((rp) => rp.permission.name);
    const payload = {
        email: user.email,
        sub: user.id,
        full_name: user.full_name,
        role: user.role.name,
        permissions: permissions,
    };
    const token = jwtService.sign(payload);
    console.log('\n==================================================');
    console.log('JWT TOKEN FOR SERVICE ENGINEER:');
    console.log(token);
    console.log('==================================================\n');
    const storeId = 'e6b4e364-df38-44ab-8572-f30d10f25be4';
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (store) {
        await prisma.store.update({
            where: { id: storeId },
            data: {
                return_status: 'Pending',
                provider_name: null,
                invoice_number: null,
            },
        });
        console.log(`Reset store ${storeId} return_status back to 'Pending' for testing.`);
    }
    else {
        console.error(`Store ${storeId} not found in database.`);
    }
    await app.close();
    await prisma.$disconnect();
    await pool.end();
}
main().catch((e) => {
    console.error(e);
});
//# sourceMappingURL=generate-token.js.map