import { Module } from '@nestjs/common';
import { MasterMillsService } from './master-mills.service';
import { MasterMillsController } from './master-mills.controller';
import { MobileMasterMillsController } from './mobile-master-mills.controller';
import { MasterMillsBulkService } from './master-mills-bulk.service';
import { MasterMillsBulkController } from './master-mills-bulk.controller';

@Module({
  controllers: [MasterMillsController, MobileMasterMillsController, MasterMillsBulkController],
  providers: [MasterMillsService, MasterMillsBulkService],
  exports: [MasterMillsService],
})
export class MasterMillsModule { }
