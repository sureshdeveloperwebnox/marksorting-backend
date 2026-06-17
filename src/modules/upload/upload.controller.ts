import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { GetPresignedUrlDto } from './dto/get-presigned-url.dto';
import { UploadImageDto } from './dto/upload-image.dto';
import { Public } from '../auth/decorators/public.decorator';

// Multer file type declaration
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

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) { }

  @Post('presigned-url')
  @Public()
  @ApiOperation({ summary: 'Get a presigned URL for file upload' })
  @ApiResponse({
    status: 201,
    description: 'Presigned URL generated successfully',
  })
  async getPresignedUrl(@Body() getPresignedUrlDto: GetPresignedUrlDto) {
    return this.uploadService.createPresignedUrl(getPresignedUrlDto);
  }

  @Post('image')
  @Public()
  @ApiOperation({
    summary: 'Upload an image directly (base64)',
    description:
      'Upload an image as base64 string. Returns the S3 key to save in database.',
  })
  @ApiResponse({
    status: 201,
    description: 'Image uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        key: {
          type: 'string',
          example: 'marksorting/abc123.png',
        },
        fileUrl: {
          type: 'string',
          example:
            'https://webnox.blr1.digitaloceanspaces.com/marksorting/abc123.png',
        },
        message: { type: 'string', example: 'Image uploaded successfully' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid image data or file type' })
  async uploadBase64Image(@Body() dto: UploadImageDto) {
    const result = await this.uploadService.uploadBase64Image(
      dto.image,
      dto.fileName,
    );
    return {
      ...result,
      message: 'Image uploaded successfully',
    };
  }

  @Post('file')
  @Public()
  @ApiOperation({
    summary: 'Upload an image file directly (multipart/form-data)',
    description:
      'Upload an image file directly. Returns the S3 key to save in database.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file to upload (jpeg, png, webp, gif, etc.)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        key: {
          type: 'string',
          example: 'marksorting/abc123.png',
        },
        fileUrl: {
          type: 'string',
          example:
            'https://webnox.blr1.digitaloceanspaces.com/marksorting/abc123.png',
        },
        message: { type: 'string', example: 'File uploaded successfully' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid file type' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: MulterFile) {
    if (!file) {
      throw new Error('No file provided');
    }

    const result = await this.uploadService.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
    );

    return {
      ...result,
      message: 'File uploaded successfully',
    };
  }
}
