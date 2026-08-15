import type { Response } from 'express';
import { ServiceReportsService } from './service-reports.service';
import { CreateServiceReportDto } from './dto/create-service-report.dto';
import { UpdateServiceReportDto } from './dto/update-service-report.dto';
export declare class ServiceReportsController {
    private readonly serviceReportsService;
    constructor(serviceReportsService: ServiceReportsService);
    findAll(req: any, skip?: string, take?: string, search?: string, status?: string, serviceCategoryId?: string, technicianId?: string, customerId?: string, millId?: string, dateFrom?: string, dateTo?: string): Promise<any>;
    downloadPdf(id: string, req: any, res: Response): Promise<void>;
    findOne(id: string, req: any): Promise<any>;
    create(dto: CreateServiceReportDto, req: any): Promise<any>;
    update(id: string, dto: UpdateServiceReportDto, req: any): Promise<{
        before: any;
        after: any;
    }>;
    remove(id: string, req: any): Promise<any>;
}
