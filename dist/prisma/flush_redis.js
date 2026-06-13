"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const ioredis_1 = __importDefault(require("ioredis"));
const redisConn = new ioredis_1.default({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
});
async function main() {
    console.log('Clearing Redis cache...');
    const result = await redisConn.flushall();
    console.log('Redis flushall result:', result);
    redisConn.disconnect();
}
main().catch(console.error);
//# sourceMappingURL=flush_redis.js.map