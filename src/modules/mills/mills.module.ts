import { Module } from '@nestjs/common';
import { MillsService } from './mills.service';
import { MillsController } from './mills.controller';
import { MobileMillsController } from './mobile-mills.controller';

@Module({
  controllers: [MillsController, MobileMillsController],
  providers: [MillsService],
  exports: [MillsService],
})
export class MillsModule {}
