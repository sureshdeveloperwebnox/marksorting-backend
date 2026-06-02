import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { S3Service } from '../../shared/services/s3.service';
import { GetPresignedUrlDto } from './dto/get-presigned-url.dto';

@Injectable()
export class UploadService {
  private readonly folderName: string;

  // Supported image MIME types
  private readonly allowedImageTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'image/bmp',
    'image/tiff',
    'image/avif',
    'image/heic',
    'image/heif',
  ];

  constructor(
    private readonly s3Service: S3Service,
    private readonly configService: ConfigService,
  ) {
    this.folderName =
      this.configService.get<string>('s3.folderName') || 'uploads';
  }

  async createPresignedUrl(dto: GetPresignedUrlDto) {
    const { fileName, fileType } = dto;
    const extension = fileName.split('.').pop();
    const uniqueFileName = `${uuidv4()}.${extension}`;
    const key = `${this.folderName}/${uniqueFileName}`;

    const uploadUrl = await this.s3Service.getPresignedUploadUrl(key, fileType);
    const fileUrl = this.s3Service.getFileUrl(key);

    return {
      uploadUrl,
      fileUrl,
      key,
      baseUrl: this.configService.get<string>('s3.baseUrl'),
    };
  }

  /**
   * Get a presigned URL for viewing a file (for private buckets)
   * @param key The file key in S3
   */
  async getViewUrl(key: string) {
    const viewUrl = await this.s3Service.getPresignedViewUrl(key);
    return {
      viewUrl,
      key,
    };
  }

  /**
   * Upload a file buffer directly to S3
   * @param fileBuffer The file buffer to upload
   * @param originalName The original filename
   * @param mimeType The MIME type of the file
   */
  async uploadFile(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
  ): Promise<{ key: string; fileUrl: string }> {
    // Validate that it's an image
    if (!this.allowedImageTypes.includes(mimeType.toLowerCase())) {
      throw new BadRequestException(
        `Invalid file type: ${mimeType}. Only image files are allowed (jpeg, png, webp, gif, svg, bmp, tiff, avif, heic, heif).`,
      );
    }

    // Generate unique filename
    const extension = originalName.split('.').pop() || 'png';
    const uniqueFileName = `${uuidv4()}.${extension}`;
    const key = `${this.folderName}/${uniqueFileName}`;

    // Upload to S3 with public-read ACL
    return this.s3Service.uploadFile(key, fileBuffer, mimeType);
  }

  /**
   * Upload a base64 encoded image directly to S3
   * @param base64String The base64 encoded image (with or without data URI prefix)
   * @param fileName Optional filename
   */
  async uploadBase64Image(
    base64String: string,
    fileName?: string,
  ): Promise<{ key: string; fileUrl: string }> {
    // Parse base64 string (handle data URI format: data:image/png;base64,...)
    let base64Data = base64String;
    let mimeType = 'image/png'; // default

    if (base64String.includes(',')) {
      const parts = base64String.split(',');
      const header = parts[0];
      base64Data = parts[1];

      // Extract MIME type from data URI
      const mimeMatch = header.match(/data:([^;]+);base64/);
      if (mimeMatch) {
        mimeType = mimeMatch[1];
      }
    }

    // Validate image type
    if (!this.allowedImageTypes.includes(mimeType.toLowerCase())) {
      throw new BadRequestException(
        `Invalid file type: ${mimeType}. Only image files are allowed.`,
      );
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');

    // Generate filename if not provided
    const extension = mimeType.split('/')[1] || 'png';
    const finalFileName = fileName || `image.${extension}`;

    return this.uploadFile(buffer, finalFileName, mimeType);
  }
}
