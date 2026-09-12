import { ExcelParserService } from '../../shared/services/excel-parser.service';
import { MasterMillsService } from './master-mills.service';
import { RedisService } from '../../redis/redis.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PreviewResponse, ImportStatus } from './interfaces/bulk-upload.interface';
interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
}
export declare class MasterMillsBulkService {
    private readonly excelParser;
    private readonly masterMillsService;
    private readonly redis;
    private readonly prisma;
    constructor(excelParser: ExcelParserService, masterMillsService: MasterMillsService, redis: RedisService, prisma: PrismaService);
    private parseExcelDate;
    private formatPhoneNumber;
    generateTemplate(): Promise<Buffer>;
    previewUpload(file: MulterFile): Promise<PreviewResponse>;
    confirmImport(importId: string): Promise<void>;
    getImportStatus(importId: string): Promise<ImportStatus>;
    private processImport;
}
export {};
