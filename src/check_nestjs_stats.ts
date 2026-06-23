import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MasterMillsController } from './modules/master-mills/master-mills.controller';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const controller = app.get(MasterMillsController);
  
  console.log("Bootstrap complete. Calling controller.getStats()...");
  const stats = await controller.getStats();
  console.log("Controller returned stats:", stats);
  console.log("Type of stats.underWarranty:", typeof stats.underWarranty);
  console.log("JSON stringified:", JSON.stringify(stats));
  
  await app.close();
}

bootstrap().catch(console.error);
