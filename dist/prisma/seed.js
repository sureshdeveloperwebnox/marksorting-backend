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
async function main() {
    const permissionsData = [
        { name: 'users.read', description: 'Can view users' },
        { name: 'users.create', description: 'Can create users' },
        { name: 'users.update', description: 'Can update users' },
        { name: 'users.delete', description: 'Can delete users' },
        { name: 'mills.manage', description: 'Can manage mills' },
        { name: 'services.manage', description: 'Can manage services' },
        { name: 'reports.view', description: 'Can view reports' },
    ];
    const permissions = [];
    for (const p of permissionsData) {
        const permission = await prisma.permission.upsert({
            where: { name: p.name },
            update: {},
            create: p,
        });
        permissions.push(permission);
    }
    const adminRole = await prisma.role.upsert({
        where: { name: 'SUPER_ADMIN' },
        update: {},
        create: {
            name: 'SUPER_ADMIN',
            description: 'Super administrator with all permissions',
        },
    });
    const userRole = await prisma.role.upsert({
        where: { name: 'USER' },
        update: {},
        create: {
            name: 'USER',
            description: 'Standard user with limited access',
        },
    });
    for (const p of permissions) {
        await prisma.rolePermission.upsert({
            where: {
                role_id_permission_id: {
                    role_id: adminRole.id,
                    permission_id: p.id,
                },
            },
            update: {},
            create: {
                role_id: adminRole.id,
                permission_id: p.id,
            },
        });
    }
    const userPermissions = permissions.filter(p => p.name === 'reports.view');
    for (const p of userPermissions) {
        await prisma.rolePermission.upsert({
            where: {
                role_id_permission_id: {
                    role_id: userRole.id,
                    permission_id: p.id,
                },
            },
            update: {},
            create: {
                role_id: userRole.id,
                permission_id: p.id,
            },
        });
    }
    const hashedPassword = await bcrypt.hash('password123', 10);
    await prisma.user.upsert({
        where: { email: 'admin@marksorting.com' },
        update: {
            password_hash: hashedPassword,
            role_id: adminRole.id,
        },
        create: {
            email: 'admin@marksorting.com',
            full_name: 'Admin User',
            password_hash: hashedPassword,
            role_id: adminRole.id,
            account_status: 'ACTIVE',
            email_verified: true,
        },
    });
    console.log('Seed data created successfully');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map