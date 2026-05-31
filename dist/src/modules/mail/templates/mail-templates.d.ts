interface BaseTemplateOptions {
    title: string;
    previewText?: string;
    bodyHtml: string;
}
export declare function getBaseTemplate({ title, previewText, bodyHtml }: BaseTemplateOptions): string;
export declare function getForgotPasswordTemplate(name: string, resetUrl: string, expiresInMinutes?: number): string;
export {};
