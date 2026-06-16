import { Module } from '@nestjs/common';
import { MasterMillsService } from './master-mills.service';
import { MasterMillsController } from './master-mills.controller';
import { MobileMasterMillsController } from './mobile-master-mills.controller';

@Module({
  controllers: [MasterMillsController, MobileMasterMillsController],
  providers: [MasterMillsService],
  exports: [MasterMillsService],
})
export class MasterMillsModule {}
