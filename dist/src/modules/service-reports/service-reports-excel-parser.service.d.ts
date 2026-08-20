import { ServiceReportPreviewRow } from './interfaces/bulk-upload.interface';
export declare class ServiceReportsExcelParserService {
    generateTemplate(): Promise<Buffer>;
    parseAndValidate(buffer: Buffer): Promise<ServiceReportPreviewRow[]>;
    private getCellStringValue;
    private isValidDate;
}
