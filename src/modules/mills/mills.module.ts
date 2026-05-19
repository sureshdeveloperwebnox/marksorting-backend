import { Module } from '@nestjs/common';
import { MillsService } from './mills.service';
import { MillsController } from './mills.controller';

@Module({
  controllers: [MillsController],
  providers: [MillsService],
  exports: [MillsService],
})
export class MillsModule {}
