import { Module } from '@nestjs/common';
import { TechniciansService } from './technicians.service';
import { TechniciansController } from './technicians.controller';
import { MobileTechniciansController } from './mobile-technicians.controller';

@Module({
  controllers: [TechniciansController, MobileTechniciansController],
  providers: [TechniciansService],
  exports: [TechniciansService],
})
export class TechniciansModule {}
