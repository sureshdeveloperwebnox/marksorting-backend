import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { Response } from 'express';
import { InstallationReportsService } from './installation-reports.service';
import { CreateInstallationReportDto } from './dto/create-installation-report.dto';
import { UpdateInstallationReportDto } from './dto/update-installation-report.dto';

@ApiTags('installation-reports')
@Controller('installation-reports')
export class InstallationReportsController {
  constructor(
    private readonly installationReportsService: InstallationReportsService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get all installation reports with pagination and filtering',
  })
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.installationReportsService.findAll({
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 10,
      search,
      status,
      dateFrom,
      dateTo,
    });
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Download installation report PDF' })
  async downloadPdf(@Param('id') id: string, @Res() res: Response) {
    const { buffer, fileName } =
      await this.installationReportsService.generatePdf(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', buffer.length);
    res.end(buffer);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get installation report by ID' })
  findOne(@Param('id') id: string) {
    return this.installationReportsService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new installation report' })
  create(@Body() dto: CreateInstallationReportDto) {
    return this.installationReportsService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update existing installation report' })
  update(@Param('id') id: string, @Body() dto: UpdateInstallationReportDto) {
    return this.installationReportsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete installation report' })
  remove(@Param('id') id: string) {
    return this.installationReportsService.remove(id);
  }
}
