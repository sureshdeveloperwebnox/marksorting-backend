import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { EventEmitterModule } from '@nestjs/event-emitter';
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
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ReportsModule } from './modules/reports/reports.module';
import { MaterialsModule } from './modules/materials/materials.module';
import { StoresModule } from './modules/stores/stores.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { ActivityLogsModule } from './modules/activity-logs/activity-logs.module';
import { ActivityLogInterceptor } from './modules/activity-logs/interceptors/activity-log.interceptor';
import { AutoActivityLogInterceptor } from './modules/activity-logs/interceptors/auto-activity-log.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

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
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty' }
            : undefined,
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
    EventEmitterModule.forRoot(),
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
    DashboardModule,
    ReportsModule,
    MaterialsModule,
    StoresModule,
    NotificationsModule,
    PermissionsModule,
    ActivityLogsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ActivityLogInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AutoActivityLogInterceptor,
    },
  ],
})
export class AppModule {}
