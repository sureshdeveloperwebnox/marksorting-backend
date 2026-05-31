"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const ioredis_1 = __importDefault(require("ioredis"));
const redisConn = new ioredis_1.default({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
});
async function run() {
    const email = 'kator18328@mtupu.com';
    const backendUrl = 'http://localhost:4000/api/v1';
    try {
        console.log('Triggering forgot password...');
        await axios_1.default.post(`${backendUrl}/auth/forgot-password`, { email });
        await new Promise(resolve => setTimeout(resolve, 1500));
        const keys = await redisConn.keys('bull:mail:*');
        for (const key of keys) {
            if (key.match(/^bull:mail:\d+$/)) {
                const hdata = await redisConn.hgetall(key);
                if (hdata && hdata.data) {
                    const parsed = JSON.parse(hdata.data);
                    if (parsed.to === email) {
                        const match = parsed.html.match(/href="([^"]+)"/);
                        if (match) {
                            console.log('RESET_URL:', match[1]);
                            return;
                        }
                    }
                }
            }
        }
        console.log('Could not find mail job.');
    }
    catch (error) {
        console.error('Error:', error.message);
    }
    finally {
        redisConn.disconnect();
    }
}
run();
//# sourceMappingURL=get-reset-url.js.map