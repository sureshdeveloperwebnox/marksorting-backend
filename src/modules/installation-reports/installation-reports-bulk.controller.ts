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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InstallationReportsBulkService } from './installation-reports-bulk.service';
import { InstallationReportBulkImportDto } from './dto/installation-report-bulk-upload.dto';

interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
}

@ApiTags('installation-reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('installation-reports')
export class InstallationReportsBulkController {
    constructor(private readonly bulkService: InstallationReportsBulkService) { }

    /**
     * GET /installation-reports/bulk-upload/template
     * Download the bulk upload Excel template.
     */
    @Get('bulk-upload/template')
    @ApiOperation({ summary: 'Download the installation report bulk upload Excel template' })
    async getTemplate(
        @Res({ passthrough: true }) res: Response,
    ): Promise<StreamableFile> {
        const buffer = await this.bulkService.generateTemplate();
        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename="installation_reports_template.xlsx"',
        });
        return new StreamableFile(buffer);
    }

    /**
     * POST /installation-reports/bulk-upload/preview
     * Upload an Excel file and receive a parsed + validated preview.
     */
    @Post('bulk-upload/preview')
    @ApiOperation({ summary: 'Upload installation report Excel file and preview parsed rows' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
            },
        },
    })
    @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
    previewUpload(@UploadedFile() file: MulterFile) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }
        return this.bulkService.previewUpload(file);
    }

    /**
     * POST /installation-reports/bulk-upload/import
     * Confirm a previewed session and start background ingestion.
     */
    @Post('bulk-upload/import')
    @HttpCode(202)
    @ApiOperation({ summary: 'Confirm and start bulk import of installation reports' })
    async confirmImport(
        @Body() dto: InstallationReportBulkImportDto,
    ): Promise<{ message: string }> {
        await this.bulkService.confirmImport(dto.importId);
        return { message: 'Import started' };
    }

    /**
     * GET /installation-reports/bulk-upload/status/:importId
     * Poll the current import progress.
     */
    @Get('bulk-upload/status/:importId')
    @ApiOperation({ summary: 'Get the status of an installation report bulk import' })
    getStatus(@Param('importId') importId: string) {
        return this.bulkService.getImportStatus(importId);
    }
}
