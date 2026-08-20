import { InstallationReportPreviewRow } from './interfaces/bulk-upload.interface';
export declare class InstallationReportsExcelParserService {
    generateTemplate(): Promise<Buffer>;
    parseAndValidate(buffer: Buffer): Promise<InstallationReportPreviewRow[]>;
    private getCellStringValue;
    private isValidDate;
}
