import { StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { MasterMillsBulkService } from './master-mills-bulk.service';
import { BulkUploadImportDto } from './dto/bulk-upload.dto';
interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
}
export declare class MasterMillsBulkController {
    private readonly bulkService;
    constructor(bulkService: MasterMillsBulkService);
    getTemplate(res: Response): Promise<StreamableFile>;
    previewUpload(file: MulterFile): Promise<import("./interfaces/bulk-upload.interface").PreviewResponse>;
    confirmImport(dto: BulkUploadImportDto): Promise<{
        message: string;
    }>;
    getStatus(importId: string): Promise<import("./interfaces/bulk-upload.interface").ImportStatus>;
}
export {};
