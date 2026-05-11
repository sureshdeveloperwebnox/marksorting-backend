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
}
