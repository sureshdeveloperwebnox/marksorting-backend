interface BaseTemplateOptions {
    title: string;
    previewText?: string;
    bodyHtml: string;
    frontendUrl?: string;
}
export declare function getBaseTemplate({ title, previewText, bodyHtml, frontendUrl, }: BaseTemplateOptions): string;
export declare function getForgotPasswordTemplate(name: string, resetUrl: string, expiresInMinutes?: number, frontendUrl?: string): string;
export {};
