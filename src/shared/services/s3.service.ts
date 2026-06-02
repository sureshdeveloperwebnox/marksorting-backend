import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ObjectCannedACL,
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
        secretAccessKey:
          this.configService.getOrThrow<string>('s3.secretAccessKey'),
      },
      forcePathStyle: false, // DigitalOcean Spaces requires this to be false
    });
  }

  /**
   * Generates a presigned URL for uploading a file
   * @param key The file path in the bucket
   * @param contentType The MIME type of the file
   * @param expiresIn Expiration time in seconds (default 15 minutes)
   */
  async getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn = 900,
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: contentType,
        // NOTE: ACL is NOT included here to avoid SignatureDoesNotMatch errors
        // The bucket policy must allow public read access instead
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      this.logger.error(
        `Error generating presigned upload URL: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Generates a presigned URL for viewing/downloading a file (for private buckets)
   * @param key The file path in the bucket
   * @param expiresIn Expiration time in seconds (default 1 hour)
   */
  async getPresignedViewUrl(
    key: string,
    expiresIn = 3600,
  ): Promise<string | null> {
    if (!key) return null;
    if (key.startsWith('http')) return key;

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      this.logger.error(
        `Error generating presigned view URL: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Returns the public URL for a file (for public buckets)
   * @param key The file path in the bucket
   */
  getFileUrl(key: string | null | undefined): string | null {
    // Return the full URL using the base URL and bucket name
    if (!key) return null;
    if (key.startsWith('http')) return key;

    const url = new URL(this.endpoint);
    return `${url.protocol}//${this.bucketName}.${url.host}/${key}`;
  }

  /**
   * Upload a file buffer directly to S3 with public-read ACL
   * @param key The file path in the bucket
   * @param buffer The file buffer to upload
   * @param contentType The MIME type of the file
   */
  async uploadFile(
    key: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<{ key: string; fileUrl: string }> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ACL: ObjectCannedACL.public_read,
      });

      await this.s3Client.send(command);

      const fileUrl = this.getFileUrl(key) || '';
      this.logger.log(`File uploaded successfully: ${key}`);

      return { key, fileUrl };
    } catch (error) {
      this.logger.error(`Error uploading file to S3: ${error.message}`);
      throw error;
    }
  }

  getStorageInfo() {
    return {
      baseUrl: this.endpoint,
      bucketName: this.bucketName,
    };
  }
}
