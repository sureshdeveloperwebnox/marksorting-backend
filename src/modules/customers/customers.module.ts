import { Module } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { MobileCustomersController } from './mobile-customers.controller';

@Module({
  controllers: [CustomersController, MobileCustomersController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
