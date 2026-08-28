import { PreviewRow } from '../../modules/master-mills/interfaces/bulk-upload.interface';
export declare class ExcelParserService {
    generateTemplate(): Promise<Buffer>;
    parseAndValidate(buffer: Buffer): Promise<PreviewRow[]>;
    private cleanGenericString;
    private cleanDateString;
    private cleanNumericString;
    private getCellStringValue;
    private isValidDate;
    private isNumeric;
}
