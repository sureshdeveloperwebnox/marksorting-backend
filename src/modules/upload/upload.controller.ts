import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { GetPresignedUrlDto } from './dto/get-presigned-url.dto';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Assuming you have an auth guard

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('presigned-url')
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a presigned URL for file upload' })
  @ApiResponse({ status: 201, description: 'Presigned URL generated successfully' })
  async getPresignedUrl(@Body() getPresignedUrlDto: GetPresignedUrlDto) {
    return this.uploadService.createPresignedUrl(getPresignedUrlDto);
  }
}
