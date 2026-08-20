import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { ServiceReportsExcelParserService } from './service-reports-excel-parser.service';
import { ServiceReportPreviewResponse, ServiceReportImportStatus } from './interfaces/bulk-upload.interface';
import { MasterMillsService } from '../master-mills/master-mills.service';
interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
}
export declare class ServiceReportsBulkService {
    private readonly excelParser;
    private readonly prisma;
    private readonly redis;
    private readonly masterMillsService;
    constructor(excelParser: ServiceReportsExcelParserService, prisma: PrismaService, redis: RedisService, masterMillsService: MasterMillsService);
    generateTemplate(): Promise<Buffer>;
    previewUpload(file: MulterFile): Promise<ServiceReportPreviewResponse>;
    confirmImport(importId: string): Promise<void>;
    getImportStatus(importId: string): Promise<ServiceReportImportStatus>;
    private processImport;
    private importSingleRow;
}
export {};
