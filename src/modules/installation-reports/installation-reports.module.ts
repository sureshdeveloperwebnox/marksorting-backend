import { Module } from '@nestjs/common';
import { InstallationReportsService } from './installation-reports.service';
import { InstallationReportsController } from './installation-reports.controller';

@Module({
    controllers: [InstallationReportsController],
    providers: [InstallationReportsService],
    exports: [InstallationReportsService],
})
export class InstallationReportsModule {}
