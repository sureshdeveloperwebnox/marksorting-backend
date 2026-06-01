import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { MobileTicketsController } from './mobile-tickets.controller';

@Module({
  controllers: [TicketsController, MobileTicketsController],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}
