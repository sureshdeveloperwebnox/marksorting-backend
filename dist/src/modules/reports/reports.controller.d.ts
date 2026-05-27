import type { Response } from 'express';
import { ReportsService } from './reports.service';
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    getServices(req: any, res: Response, skip?: string, take?: string, search?: string, status?: string, categoryId?: string, dateFrom?: string, dateTo?: string, exportType?: 'pdf' | 'csv' | 'excel'): Promise<Response<any, Record<string, any>>>;
    getInstallations(req: any, res: Response, skip?: string, take?: string, search?: string, status?: string, dateFrom?: string, dateTo?: string, exportType?: 'pdf' | 'csv' | 'excel'): Promise<Response<any, Record<string, any>>>;
    getExpenses(req: any, res: Response, skip?: string, take?: string, search?: string, status?: string, categoryId?: string, dateFrom?: string, dateTo?: string, exportType?: 'pdf' | 'csv' | 'excel'): Promise<Response<any, Record<string, any>>>;
}
