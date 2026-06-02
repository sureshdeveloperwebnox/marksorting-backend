import { ConfigService } from '@nestjs/config';
export declare class S3Service {
    private configService;
    private readonly s3Client;
    private readonly logger;
    private readonly bucketName;
    private readonly region;
    private readonly endpoint;
    constructor(configService: ConfigService);
    getPresignedUploadUrl(key: string, contentType: string, expiresIn?: number): Promise<string>;
    getPresignedViewUrl(key: string, expiresIn?: number): Promise<string | null>;
    getFileUrl(key: string | null | undefined): string | null;
    getStorageInfo(): {
        baseUrl: string;
        bucketName: string;
    };
}
