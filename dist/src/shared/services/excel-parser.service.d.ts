import { PreviewRow } from '../../modules/master-mills/interfaces/bulk-upload.interface';
export declare class ExcelParserService {
    generateTemplate(): Promise<Buffer>;
    parseAndValidate(buffer: Buffer): Promise<PreviewRow[]>;
    private getCellStringValue;
    private isValidDate;
    private isNumeric;
}
