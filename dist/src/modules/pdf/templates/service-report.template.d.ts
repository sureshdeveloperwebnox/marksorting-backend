import { DocumentTemplateService } from './document-template.service';
import type { PDFOptions } from 'puppeteer';
export interface CompanyPdfSettings {
    logoUrl?: string;
    name?: string;
    partnerDescription?: string;
    addressLine1?: string;
    addressLine2?: string;
    region?: string;
    email?: string;
    tollFree?: string;
    cellNumbers?: string;
    gstNo?: string;
}
export interface ServiceReportPdfData {
    report: any;
    company: CompanyPdfSettings;
}
export declare function renderServiceReportPdfOptions(company: CompanyPdfSettings, template: DocumentTemplateService): PDFOptions;
export declare function renderServiceReportTemplate(data: ServiceReportPdfData, template: DocumentTemplateService): string;
