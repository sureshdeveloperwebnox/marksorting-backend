import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
  HttpCode,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MasterMillsBulkService } from './master-mills-bulk.service';
import { BulkUploadImportDto } from './dto/bulk-upload.dto';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@ApiTags('master-mills')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('master-mills')
export class MasterMillsBulkController {
  constructor(private readonly bulkService: MasterMillsBulkService) {}

  @Get('bulk-upload/template')
  @ApiOperation({ summary: 'Download the bulk upload Excel template' })
  async getTemplate(
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const buffer = await this.bulkService.generateTemplate();
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition':
        'attachment; filename="master_mills_template.xlsx"',
    });
    return new StreamableFile(buffer);
  }

  @Post('bulk-upload/preview')
  @ApiOperation({
    summary: 'Upload an Excel file and preview parsed rows before import',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  previewUpload(@UploadedFile() file: MulterFile) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.bulkService.previewUpload(file);
  }

  @Post('bulk-upload/import')
  @HttpCode(202)
  @ApiOperation({
    summary: 'Confirm import of a previously previewed upload session',
  })
  async confirmImport(
    @Body() dto: BulkUploadImportDto,
  ): Promise<{ message: string }> {
    await this.bulkService.confirmImport(dto.importId);
    return { message: 'Import started' };
  }

  @Get('bulk-upload/status/:importId')
  @ApiOperation({
    summary: 'Get the current status of an ongoing or completed import',
  })
  getStatus(@Param('importId') importId: string) {
    return this.bulkService.getImportStatus(importId);
  }
}
