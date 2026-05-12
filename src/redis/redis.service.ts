import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService extends Redis implements OnModuleDestroy {
  constructor(configService: ConfigService) {
    super({
      host: configService.get<string>('redis.host') || 'localhost',
      port: configService.get<number>('redis.port') || 6379,
      password: configService.get<string>('redis.password'),
    });

    this.on('error', (err) => {
      // Log the error but don't crash
      console.error('Redis Connection Error:', err.message);
    });
  }

  onModuleDestroy() {
    this.disconnect();
  }

  async getJson<T>(key: string): Promise<T | null> {
    const data = await this.get(key);
    return data ? JSON.parse(data) : null;
  }

  async setJson(key: string, value: any, ttl?: number): Promise<void> {
    const data = JSON.stringify(value);
    if (ttl) {
      await this.set(key, data, 'EX', ttl);
    } else {
      await this.set(key, data);
    }
  }

  async delByPrefix(prefix: string): Promise<void> {
    const keys = await this.keys(`${prefix}*`);
    if (keys.length > 0) {
      await this.del(...keys);
    }
  }
}
