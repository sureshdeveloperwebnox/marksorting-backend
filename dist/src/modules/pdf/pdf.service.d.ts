import { ConfigService } from '@nestjs/config';
import { PDFOptions } from 'puppeteer';
export declare class PdfService {
    private readonly configService;
    private readonly logger;
    private readonly maxEmbeddedImageBytes;
    private readonly allowedImageContentTypes;
    private browserPromise;
    constructor(configService: ConfigService);
    private getBrowser;
    renderHtmlToPdf(html: string, options?: PDFOptions): Promise<Buffer>;
    embedImageAsDataUrl(src: string | undefined | null): Promise<string>;
    private getAllowedImageHosts;
}
