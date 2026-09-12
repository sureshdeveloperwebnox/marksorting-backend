import { UploadService } from './upload.service';
import { GetPresignedUrlDto } from './dto/get-presigned-url.dto';
import { UploadImageDto } from './dto/upload-image.dto';
interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination?: string;
    filename?: string;
    path?: string;
    buffer: Buffer;
}
export declare class UploadController {
    private readonly uploadService;
    constructor(uploadService: UploadService);
    getPresignedUrl(getPresignedUrlDto: GetPresignedUrlDto): Promise<{
        uploadUrl: string;
        fileUrl: string | null;
        key: string;
        baseUrl: string | undefined;
    }>;
    uploadBase64Image(dto: UploadImageDto): Promise<{
        message: string;
        key: string;
        fileUrl: string;
    }>;
    uploadFile(file: MulterFile): Promise<{
        message: string;
        key: string;
        fileUrl: string;
    }>;
}
export {};
