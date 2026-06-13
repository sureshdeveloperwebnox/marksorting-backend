import { Module } from '@nestjs/common';
import { MasterMillsService } from './master-mills.service';
import { MasterMillsController } from './master-mills.controller';

@Module({
  controllers: [MasterMillsController],
  providers: [MasterMillsService],
  exports: [MasterMillsService],
})
export class MasterMillsModule {}
