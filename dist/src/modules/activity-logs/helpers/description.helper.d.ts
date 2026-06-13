export declare const FIELD_LABELS: Record<string, string>;
export declare function buildChangeSummary(body: Record<string, unknown>): string;
export declare function buildDiffSummary(before: Record<string, unknown>, after: Record<string, unknown>, body: Record<string, unknown>): string;
export declare function updateDescription(entityLabel: string, name: string, body: Record<string, unknown>, actor?: string): string;
export declare function createDescription(entityLabel: string, name: string, details?: string, actor?: string): string;
export declare function deleteDescription(entityLabel: string, name: string, actor?: string): string;
