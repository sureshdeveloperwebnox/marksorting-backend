import type { Response } from 'express';
import { InstallationReportsService } from './installation-reports.service';
import { CreateMobileInstallationReportDto } from './dto/create-mobile-installation-report.dto';
import { UpdateMobileInstallationReportDto } from './dto/update-mobile-installation-report.dto';
export declare class MobileInstallationReportsController {
    private readonly installationReportsService;
    constructor(installationReportsService: InstallationReportsService);
    findAll(req: any, skip?: string, take?: string, search?: string, status?: string, dateFrom?: string, dateTo?: string, startDate?: string, endDate?: string, expenseEligibleOnly?: string, excludeExpenseId?: string): Promise<any>;
    findOne(id: string, req: any): Promise<any>;
    create(dto: CreateMobileInstallationReportDto, req: any): Promise<any>;
    update(id: string, dto: UpdateMobileInstallationReportDto, req: any): Promise<{
        before: any;
        after: any;
    }>;
    remove(id: string, req: any): Promise<any>;
    downloadPdf(id: string, req: any, res: Response): Promise<void>;
}
