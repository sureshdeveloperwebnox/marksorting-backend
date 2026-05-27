import { ConfigService } from '@nestjs/config';
import { S3Service } from '../../shared/services/s3.service';
import { GetPresignedUrlDto } from './dto/get-presigned-url.dto';
export declare class UploadService {
    private readonly s3Service;
    private readonly configService;
    private readonly folderName;
    constructor(s3Service: S3Service, configService: ConfigService);
    createPresignedUrl(dto: GetPresignedUrlDto): Promise<{
        uploadUrl: string;
        fileUrl: string | null;
        key: string;
        baseUrl: string | undefined;
    }>;
}
