"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = __importDefault(require("ioredis"));
let RedisService = class RedisService extends ioredis_1.default {
    constructor(configService) {
        super({
            host: configService.get('redis.host') || 'localhost',
            port: configService.get('redis.port') || 6379,
            password: configService.get('redis.password'),
        });
        this.on('error', (err) => {
            console.error('Redis Connection Error:', err.message);
        });
    }
    onModuleDestroy() {
        this.disconnect();
    }
    async getJson(key) {
        const data = await this.get(key);
        return data ? JSON.parse(data) : null;
    }
    async setJson(key, value, ttl) {
        const data = JSON.stringify(value);
        if (ttl) {
            await this.set(key, data, 'EX', ttl);
        }
        else {
            await this.set(key, data);
        }
    }
    async delByPrefix(prefix) {
        const keys = await this.keys(`${prefix}*`);
        if (keys.length > 0) {
            await this.del(...keys);
        }
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisService);
//# sourceMappingURL=redis.service.js.map