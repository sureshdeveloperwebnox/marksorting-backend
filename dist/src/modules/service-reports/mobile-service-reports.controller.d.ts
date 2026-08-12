import type { Response } from 'express';
import { ServiceReportsService } from './service-reports.service';
import { CreateMobileServiceReportDto } from './dto/create-mobile-service-report.dto';
import { UpdateMobileServiceReportDto } from './dto/update-mobile-service-report.dto';
export declare class MobileServiceReportsController {
    private readonly serviceReportsService;
    constructor(serviceReportsService: ServiceReportsService);
    findAll(req: any, skip?: string, take?: string, search?: string, status?: string, serviceCategoryId?: string, dateFrom?: string, dateTo?: string, startDate?: string, endDate?: string, expenseEligibleOnly?: string, excludeExpenseId?: string): Promise<any>;
    findOne(id: string, req: any): Promise<any>;
    create(dto: CreateMobileServiceReportDto, req: any): Promise<any>;
    update(id: string, dto: UpdateMobileServiceReportDto, req: any): Promise<{
        before: any;
        after: any;
    }>;
    remove(id: string, req: any): Promise<any>;
    downloadPdf(id: string, req: any, res: Response): Promise<void>;
}
