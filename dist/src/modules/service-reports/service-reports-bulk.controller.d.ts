import { StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { ServiceReportsBulkService } from './service-reports-bulk.service';
import { ServiceReportBulkImportDto } from './dto/service-report-bulk-upload.dto';
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
    constructor(bulkService: ServiceReportsBulkService);
    getTemplate(res: Response): Promise<StreamableFile>;
    previewUpload(file: MulterFile): Promise<import("./interfaces/bulk-upload.interface").ServiceReportPreviewResponse>;
    confirmImport(dto: ServiceReportBulkImportDto): Promise<{
        message: string;
    }>;
    getStatus(importId: string): Promise<import("./interfaces/bulk-upload.interface").ServiceReportImportStatus>;
}
export {};
