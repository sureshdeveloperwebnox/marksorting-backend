import { UploadService } from './upload.service';
import { GetPresignedUrlDto } from './dto/get-presigned-url.dto';
export declare class UploadController {
    private readonly uploadService;
    constructor(uploadService: UploadService);
    getPresignedUrl(getPresignedUrlDto: GetPresignedUrlDto): Promise<{
        uploadUrl: string;
        fileUrl: string | null;
        key: string;
        baseUrl: string | undefined;
    }>;
}
