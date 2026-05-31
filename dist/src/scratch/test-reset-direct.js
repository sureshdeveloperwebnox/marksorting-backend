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
const core_1 = require("@nestjs/core");
const app_module_js_1 = require("../app.module.js");
const auth_service_js_1 = require("../modules/auth/auth.service.js");
const prisma_service_js_1 = require("../prisma/prisma.service.js");
const ioredis_1 = __importDefault(require("ioredis"));
const bcrypt = __importStar(require("bcrypt"));
const axios_1 = __importDefault(require("axios"));
const redisConn = new ioredis_1.default({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
});
async function main() {
    const email = 'kator18328@mtupu.com';
    const backendUrl = 'http://localhost:4000/api/v1';
    try {
        console.log('1. Triggering forgot password via HTTP...');
        await axios_1.default.post(`${backendUrl}/auth/forgot-password`, { email });
        await new Promise(resolve => setTimeout(resolve, 1500));
        console.log('2. Fetching token from Redis...');
        const keys = await redisConn.keys('bull:mail:*');
        let rawToken = null;
        for (const key of keys) {
            if (key.match(/^bull:mail:\d+$/)) {
                const hdata = await redisConn.hgetall(key);
                if (hdata && hdata.data) {
                    const parsed = JSON.parse(hdata.data);
                    if (parsed.to === email) {
                        const match = parsed.html.match(/token=([a-f0-9]+)/);
                        if (match) {
                            rawToken = match[1];
                            break;
                        }
                    }
                }
            }
        }
        if (!rawToken) {
            console.error('Failed to extract token from Redis!');
            return;
        }
        console.log('Extracted token:', rawToken);
        console.log('3. Bootstrapping NestJS...');
        const app = await core_1.NestFactory.createApplicationContext(app_module_js_1.AppModule);
        const authService = app.get(auth_service_js_1.AuthService);
        const prisma = app.get(prisma_service_js_1.PrismaService);
        console.log('4. Calling authService.resetPassword directly...');
        const targetPassword = 'NewVetri@123';
        await authService.resetPassword(rawToken, targetPassword);
        console.log('Direct resetPassword call completed.');
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            console.error('User not found in database!');
            await app.close();
            return;
        }
        console.log('Updated user hash in database:', user.password_hash);
        const matches = await bcrypt.compare(targetPassword, user.password_hash);
        console.log(`Bcrypt check for password "${targetPassword}" vs DB hash: ${matches ? 'MATCHES' : 'does NOT match'}`);
        await app.close();
    }
    catch (error) {
        console.error('Error during direct test:', error.message);
    }
    finally {
        redisConn.disconnect();
    }
}
main();
//# sourceMappingURL=test-reset-direct.js.map