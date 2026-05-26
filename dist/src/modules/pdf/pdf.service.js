"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var PdfService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const puppeteer_1 = __importDefault(require("puppeteer"));
let PdfService = PdfService_1 = class PdfService {
    configService;
    logger = new common_1.Logger(PdfService_1.name);
    maxEmbeddedImageBytes = 2 * 1024 * 1024;
    allowedImageContentTypes = new Set([
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/webp',
        'image/gif',
        'image/svg+xml',
    ]);
    browserPromise = null;
    constructor(configService) {
        this.configService = configService;
    }
    async getBrowser() {
        if (!this.browserPromise) {
            this.browserPromise = puppeteer_1.default.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--font-render-hinting=none',
                ],
            });
        }
        try {
            return await this.browserPromise;
        }
        catch (error) {
            this.browserPromise = null;
            throw error;
        }
    }
    async renderHtmlToPdf(html, options = {}) {
        const browser = await this.getBrowser();
        const page = await browser.newPage();
        try {
            await page.setRequestInterception(true);
            page.on('request', (request) => {
                const resourceType = request.resourceType();
                const url = request.url();
                const isExternalAsset = url.startsWith('https://') || url.startsWith('http://');
                const isAllowedExternalAsset = isExternalAsset &&
                    ['document', 'image', 'font'].includes(resourceType);
                if (url.startsWith('data:') ||
                    resourceType === 'document' ||
                    isAllowedExternalAsset) {
                    request.continue();
                    return;
                }
                request.abort();
            });
            await page.setContent(html, {
                waitUntil: 'domcontentloaded',
                timeout: 30000,
            });
            await page.waitForNetworkIdle({ timeout: 30000 }).catch(() => undefined);
            const pdf = await page.pdf({
                format: 'A4',
                printBackground: true,
                preferCSSPageSize: true,
                margin: {
                    top: '10mm',
                    right: '10mm',
                    bottom: '10mm',
                    left: '10mm',
                },
                ...options,
            });
            return Buffer.from(pdf);
        }
        catch (error) {
            this.logger.error('Failed to render PDF', error instanceof Error ? error.stack : String(error));
            throw error;
        }
        finally {
            await page.close().catch((error) => {
                this.logger.warn(`Failed to close PDF page: ${error instanceof Error ? error.message : String(error)}`);
            });
        }
    }
    async embedImageAsDataUrl(src) {
        if (!src)
            return '';
        if (src.startsWith('data:image/'))
            return src;
        let imageUrl;
        try {
            imageUrl = new URL(src);
        }
        catch {
            return '';
        }
        if (!['https:', 'http:'].includes(imageUrl.protocol))
            return '';
        if (!this.getAllowedImageHosts().has(imageUrl.hostname))
            return '';
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        try {
            const response = await fetch(imageUrl, {
                signal: controller.signal,
                redirect: 'follow',
            });
            if (!response.ok)
                return '';
            const contentType = response.headers
                .get('content-type')
                ?.split(';')[0]
                ?.trim()
                .toLowerCase() || '';
            if (!this.allowedImageContentTypes.has(contentType))
                return '';
            const contentLength = Number(response.headers.get('content-length') || '0');
            if (contentLength > this.maxEmbeddedImageBytes)
                return '';
            const arrayBuffer = await response.arrayBuffer();
            if (arrayBuffer.byteLength > this.maxEmbeddedImageBytes)
                return '';
            return `data:${contentType};base64,${Buffer.from(arrayBuffer).toString('base64')}`;
        }
        catch (error) {
            this.logger.warn(`Failed to embed PDF image: ${error instanceof Error ? error.message : String(error)}`);
            return '';
        }
        finally {
            clearTimeout(timeout);
        }
    }
    getAllowedImageHosts() {
        const hosts = new Set();
        const s3BaseUrl = this.configService.get('s3.baseUrl');
        const bucketName = this.configService.get('s3.bucketName');
        if (!s3BaseUrl)
            return hosts;
        try {
            const baseHost = new URL(s3BaseUrl).hostname;
            hosts.add(baseHost);
            if (bucketName) {
                hosts.add(`${bucketName}.${baseHost}`);
            }
        }
        catch {
            return hosts;
        }
        return hosts;
    }
};
exports.PdfService = PdfService;
exports.PdfService = PdfService = PdfService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PdfService);
//# sourceMappingURL=pdf.service.js.map