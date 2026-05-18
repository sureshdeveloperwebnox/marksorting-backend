import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;
  private readonly logger = new Logger(S3Service.name);
  private readonly bucketName: string;
  private readonly region: string;
  private readonly endpoint: string;

  constructor(private configService: ConfigService) {
    this.region = this.configService.getOrThrow<string>('s3.region');
    this.bucketName = this.configService.getOrThrow<string>('s3.bucketName');
    this.endpoint = this.configService.getOrThrow<string>('s3.baseUrl');

    this.s3Client = new S3Client({
      region: this.region,
      endpoint: this.endpoint,
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>('s3.accessKey'),
        secretAccessKey: this.configService.getOrThrow<string>('s3.secretAccessKey'),
      },
      forcePathStyle: false, // DigitalOcean Spaces requires this to be false
    });
  }

  /**
   * Generates a presigned URL for uploading a file
   * @param key The file path in the bucket
   * @param contentType The MIME type of the file
   * @param expiresIn Expiration time in seconds (default 5 minutes)
   */
  async getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn = 300,
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: contentType,
        ACL: 'public-read', // Assuming public access for images
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      this.logger.error(`Error generating presigned upload URL: ${error.message}`);
      throw error;
    }
  }

  /**
   * Returns the public URL for a file
   * @param key The file path in the bucket
   */
  getFileUrl(key: string | null | undefined): string | null {
    // Return the full URL using the base URL and bucket name
    if (!key) return null;
    if (key.startsWith('http')) return key;
    
    const url = new URL(this.endpoint);
    return `${url.protocol}//${this.bucketName}.${url.host}/${key}`;
  }

  getStorageInfo() {
    return {
      baseUrl: this.endpoint,
      bucketName: this.bucketName,
    };
  }
}
