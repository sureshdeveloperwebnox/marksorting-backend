import { DocumentTemplateService } from '../../pdf/templates/document-template.service';
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
export interface TabularReportPdfData {
    title: string;
    filters: {
        label: string;
        value: string;
    }[];
    metrics: {
        label: string;
        value: string;
        colorClass?: string;
    }[];
    headers: string[];
    rows: string[][];
    company: CompanyPdfSettings;
}
export declare function renderTabularReportPdfOptions(company: CompanyPdfSettings, template: DocumentTemplateService): PDFOptions;
export declare function renderTabularReportTemplate(data: TabularReportPdfData, template: DocumentTemplateService): string;
