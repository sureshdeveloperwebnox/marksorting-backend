import { Module } from '@nestjs/common';
import { PdfModule } from '../pdf/pdf.module';
import { SettingsModule } from '../settings/settings.module';
import { InstallationReportsService } from './installation-reports.service';
import { InstallationReportsController } from './installation-reports.controller';

@Module({
    imports: [PdfModule, SettingsModule],
    controllers: [InstallationReportsController],
    providers: [InstallationReportsService],
    exports: [InstallationReportsService],
})
export class InstallationReportsModule {}
