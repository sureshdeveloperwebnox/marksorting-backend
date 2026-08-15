import { StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { ServiceReportsBulkService } from './service-reports-bulk.service';
import { ServiceReportBulkImportDto } from './dto/service-report-bulk-upload.dto';
import { ServiceReportsService } from './service-reports.service';
interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
}
export declare class ServiceReportsBulkController {
    private readonly bulkService;
    private readonly serviceReportsService;
    constructor(bulkService: ServiceReportsBulkService, serviceReportsService: ServiceReportsService);
    bulkDeleteByDate(startDate?: string, endDate?: string, beforeDate?: string, bodyStartDate?: string, bodyEndDate?: string, bodyBeforeDate?: string, req?: any): Promise<{
        count: number;
        message: string;
    }>;
    getTemplate(res: Response): Promise<StreamableFile>;
    previewUpload(file: MulterFile): Promise<import("./interfaces/bulk-upload.interface").ServiceReportPreviewResponse>;
    confirmImport(dto: ServiceReportBulkImportDto): Promise<{
        message: string;
    }>;
    getStatus(importId: string): Promise<import("./interfaces/bulk-upload.interface").ServiceReportImportStatus>;
}
export {};
