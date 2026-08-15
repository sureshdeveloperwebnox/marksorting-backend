import { StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { InstallationReportsBulkService } from './installation-reports-bulk.service';
import { InstallationReportBulkImportDto } from './dto/installation-report-bulk-upload.dto';
import { InstallationReportsService } from './installation-reports.service';
interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
}
export declare class InstallationReportsBulkController {
    private readonly bulkService;
    private readonly installationReportsService;
    constructor(bulkService: InstallationReportsBulkService, installationReportsService: InstallationReportsService);
    bulkDeleteByDate(startDate?: string, endDate?: string, beforeDate?: string, bodyStartDate?: string, bodyEndDate?: string, bodyBeforeDate?: string, req?: any): Promise<{
        count: any;
        message: string;
    }>;
    getTemplate(res: Response): Promise<StreamableFile>;
    previewUpload(file: MulterFile): Promise<import("./interfaces/bulk-upload.interface").InstallationReportPreviewResponse>;
    confirmImport(dto: InstallationReportBulkImportDto): Promise<{
        message: string;
    }>;
    getStatus(importId: string): Promise<import("./interfaces/bulk-upload.interface").InstallationReportImportStatus>;
}
export {};
