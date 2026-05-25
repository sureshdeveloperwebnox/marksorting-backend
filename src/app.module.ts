import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { LoggerModule } from 'nestjs-pino';
import configuration from './config/configuration';
import { validationSchema } from './config/validation';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { MillsModule } from './modules/mills/mills.module';
import { ServiceCategoriesModule } from './modules/service-categories/service-categories.module';
import { ServiceReportsModule } from './modules/service-reports/service-reports.module';
import { InstallationReportsModule } from './modules/installation-reports/installation-reports.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { ExpenseCategoriesModule } from './modules/expense-categories/expense-categories.module';
import { CustomersModule } from './modules/customers/customers.module';
import { SharedModule } from './shared/shared.module';
import { UploadModule } from './modules/upload/upload.module';
import { TechniciansModule } from './modules/technicians/technicians.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { SettingsModule } from './modules/settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        safe: true,
        transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
      },
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('redis.host') || 'localhost',
          port: configService.get<number>('redis.port') || 6379,
          password: configService.get<string>('redis.password'),
        },
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    RolesModule,
    MillsModule,
    ServiceCategoriesModule,
    ServiceReportsModule,
    InstallationReportsModule,
    ExpensesModule,
    ExpenseCategoriesModule,
    CustomersModule,
    SharedModule,
    UploadModule,
    TechniciansModule,
    TicketsModule,
    SettingsModule,
  ],
})
export class AppModule { }
