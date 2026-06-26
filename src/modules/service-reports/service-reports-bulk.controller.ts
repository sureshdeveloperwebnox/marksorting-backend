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
import { ServiceReportsBulkService } from './service-reports-bulk.service';
import { ServiceReportBulkImportDto } from './dto/service-report-bulk-upload.dto';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@ApiTags('service-reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('service-reports')
export class ServiceReportsBulkController {
  constructor(private readonly bulkService: ServiceReportsBulkService) {}

  /**
   * GET /service-reports/bulk-upload/template
   * Download the bulk upload Excel template for service reports.
   */
  @Get('bulk-upload/template')
  @ApiOperation({
    summary: 'Download the service report bulk upload Excel template',
  })
  async getTemplate(
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const buffer = await this.bulkService.generateTemplate();
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition':
        'attachment; filename="service_reports_template.xlsx"',
    });
    return new StreamableFile(buffer);
  }

  /**
   * POST /service-reports/bulk-upload/preview
   * Upload an Excel file and receive a parsed + validated preview before committing.
   */
  @Post('bulk-upload/preview')
  @ApiOperation({
    summary: 'Upload a service report Excel file and preview parsed rows',
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

  /**
   * POST /service-reports/bulk-upload/import
   * Confirm a previewed upload session and start background ingestion.
   */
  @Post('bulk-upload/import')
  @HttpCode(202)
  @ApiOperation({ summary: 'Confirm and start bulk import of service reports' })
  async confirmImport(
    @Body() dto: ServiceReportBulkImportDto,
  ): Promise<{ message: string }> {
    await this.bulkService.confirmImport(dto.importId);
    return { message: 'Import started' };
  }

  /**
   * GET /service-reports/bulk-upload/status/:importId
   * Poll the current import progress for a running or completed import session.
   */
  @Get('bulk-upload/status/:importId')
  @ApiOperation({
    summary: 'Get the status of an ongoing or completed service report import',
  })
  getStatus(@Param('importId') importId: string) {
    return this.bulkService.getImportStatus(importId);
  }
}
