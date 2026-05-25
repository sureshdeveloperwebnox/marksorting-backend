export declare class DocumentTemplateService {
    escape(value: unknown): string;
    text(value: unknown, fallback?: string): string;
    date(value: unknown, fallback?: string): string;
    yesNo(value: unknown): string;
    imageSrc(value: unknown): string;
}
