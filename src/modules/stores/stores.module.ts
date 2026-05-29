import { Module } from '@nestjs/common';
import { StoresService } from './stores.service';
import { StoresController } from './stores.controller';
import { MobileStoresController } from './mobile-stores.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { RedisModule } from '../../redis/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [StoresController, MobileStoresController],
  providers: [StoresService],
  exports: [StoresService],
})
export class StoresModule {}
