import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import puppeteer, { Browser, PDFOptions } from 'puppeteer';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);
  private readonly maxEmbeddedImageBytes = 2 * 1024 * 1024;
  private readonly allowedImageContentTypes = new Set([
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/gif',
    'image/svg+xml',
  ]);
  private browserPromise: Promise<Browser> | null = null;

  constructor(private readonly configService: ConfigService) {}

  private async getBrowser(): Promise<Browser> {
    if (!this.browserPromise) {
      this.browserPromise = puppeteer.launch({
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
    } catch (error) {
      this.browserPromise = null;
      throw error;
    }
  }

  async renderHtmlToPdf(
    html: string,
    options: PDFOptions = {},
  ): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      await page.setRequestInterception(true);
      page.on('request', (request) => {
        const resourceType = request.resourceType();
        const url = request.url();

        const isExternalAsset =
          url.startsWith('https://') || url.startsWith('http://');
        const isAllowedExternalAsset =
          isExternalAsset &&
          ['document', 'image', 'font'].includes(resourceType);

        if (
          url.startsWith('data:') ||
          resourceType === 'document' ||
          isAllowedExternalAsset
        ) {
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
    } catch (error) {
      this.logger.error(
        'Failed to render PDF',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    } finally {
      await page.close().catch((error) => {
        this.logger.warn(
          `Failed to close PDF page: ${error instanceof Error ? error.message : String(error)}`,
        );
      });
    }
  }

  async embedImageAsDataUrl(src: string | undefined | null): Promise<string> {
    if (!src) return '';
    if (src.startsWith('data:image/')) return src;

    let imageUrl: URL;
    try {
      imageUrl = new URL(src);
    } catch {
      return '';
    }

    if (!['https:', 'http:'].includes(imageUrl.protocol)) return '';
    if (!this.getAllowedImageHosts().has(imageUrl.hostname)) return '';

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(imageUrl, {
        signal: controller.signal,
        redirect: 'follow',
      });

      if (!response.ok) return '';

      const contentType =
        response.headers
          .get('content-type')
          ?.split(';')[0]
          ?.trim()
          .toLowerCase() || '';
      if (!this.allowedImageContentTypes.has(contentType)) return '';

      const contentLength = Number(
        response.headers.get('content-length') || '0',
      );
      if (contentLength > this.maxEmbeddedImageBytes) return '';

      const arrayBuffer = await response.arrayBuffer();
      if (arrayBuffer.byteLength > this.maxEmbeddedImageBytes) return '';

      return `data:${contentType};base64,${Buffer.from(arrayBuffer).toString('base64')}`;
    } catch (error) {
      this.logger.warn(
        `Failed to embed PDF image: ${error instanceof Error ? error.message : String(error)}`,
      );
      return '';
    } finally {
      clearTimeout(timeout);
    }
  }

  private getAllowedImageHosts(): Set<string> {
    const hosts = new Set<string>();
    const s3BaseUrl = this.configService.get<string>('s3.baseUrl');
    const bucketName = this.configService.get<string>('s3.bucketName');

    if (!s3BaseUrl) return hosts;

    try {
      const baseHost = new URL(s3BaseUrl).hostname;
      hosts.add(baseHost);
      if (bucketName) {
        hosts.add(`${bucketName}.${baseHost}`);
      }
    } catch {
      return hosts;
    }

    return hosts;
  }
}
