import { ConfigService } from '@nestjs/config';
import { S3Service } from '../../shared/services/s3.service';
import { GetPresignedUrlDto } from './dto/get-presigned-url.dto';
export declare class UploadService {
    private readonly s3Service;
    private readonly configService;
    private readonly folderName;
    private readonly allowedImageTypes;
    constructor(s3Service: S3Service, configService: ConfigService);
    createPresignedUrl(dto: GetPresignedUrlDto): Promise<{
        uploadUrl: string;
        fileUrl: string | null;
        key: string;
        baseUrl: string | undefined;
    }>;
    getViewUrl(key: string): Promise<{
        viewUrl: string | null;
        key: string;
    }>;
    uploadFile(fileBuffer: Buffer, originalName: string, mimeType: string): Promise<{
        key: string;
        fileUrl: string;
    }>;
    uploadBase64Image(base64String: string, fileName?: string): Promise<{
        key: string;
        fileUrl: string;
    }>;
}
