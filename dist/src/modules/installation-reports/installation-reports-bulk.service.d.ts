import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { InstallationReportsExcelParserService } from './installation-reports-excel-parser.service';
import { InstallationReportPreviewResponse, InstallationReportImportStatus } from './interfaces/bulk-upload.interface';
interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
}
export declare class InstallationReportsBulkService {
    private readonly excelParser;
    private readonly prisma;
    private readonly redis;
    constructor(excelParser: InstallationReportsExcelParserService, prisma: PrismaService, redis: RedisService);
    generateTemplate(): Promise<Buffer>;
    previewUpload(file: MulterFile): Promise<InstallationReportPreviewResponse>;
    confirmImport(importId: string): Promise<void>;
    getImportStatus(importId: string): Promise<InstallationReportImportStatus>;
    private processImport;
    private importSingleRow;
}
export {};
