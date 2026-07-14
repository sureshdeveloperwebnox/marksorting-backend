import { StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { InstallationReportsBulkService } from './installation-reports-bulk.service';
import { InstallationReportBulkImportDto } from './dto/installation-report-bulk-upload.dto';
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
    constructor(bulkService: InstallationReportsBulkService);
    getTemplate(res: Response): Promise<StreamableFile>;
    previewUpload(file: MulterFile): Promise<import("./interfaces/bulk-upload.interface").InstallationReportPreviewResponse>;
    confirmImport(dto: InstallationReportBulkImportDto): Promise<{
        message: string;
    }>;
    getStatus(importId: string): Promise<import("./interfaces/bulk-upload.interface").InstallationReportImportStatus>;
}
export {};
