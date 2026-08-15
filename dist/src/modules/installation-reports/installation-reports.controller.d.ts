import type { Response } from 'express';
import { InstallationReportsService } from './installation-reports.service';
import { CreateInstallationReportDto } from './dto/create-installation-report.dto';
import { UpdateInstallationReportDto } from './dto/update-installation-report.dto';
export declare class InstallationReportsController {
    private readonly installationReportsService;
    constructor(installationReportsService: InstallationReportsService);
    findAll(req: any, skip?: string, take?: string, search?: string, status?: string, technicianId?: string, customerId?: string, millId?: string, dateFrom?: string, dateTo?: string): Promise<any>;
    downloadPdf(id: string, req: any, res: Response): Promise<void>;
    findOne(id: string, req: any): Promise<any>;
    create(dto: CreateInstallationReportDto, req: any): Promise<any>;
    update(id: string, dto: UpdateInstallationReportDto, req: any): Promise<{
        before: any;
        after: any;
    }>;
    remove(id: string, req: any): Promise<any>;
}
