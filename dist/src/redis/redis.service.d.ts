import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
export declare class RedisService extends Redis implements OnModuleDestroy {
    constructor(configService: ConfigService);
    onModuleDestroy(): void;
    getJson<T>(key: string): Promise<T | null>;
    setJson(key: string, value: any, ttl?: number): Promise<void>;
    delByPrefix(prefix: string): Promise<void>;
}
