import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { S3Service } from '../../shared/services/s3.service';
import { GetPresignedUrlDto } from './dto/get-presigned-url.dto';

@Injectable()
export class UploadService {
  private readonly folderName: string;

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
}
