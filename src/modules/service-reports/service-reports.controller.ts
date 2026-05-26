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
import { ServiceReportsService } from './service-reports.service';
import { CreateServiceReportDto } from './dto/create-service-report.dto';
import { UpdateServiceReportDto } from './dto/update-service-report.dto';

@ApiTags('service-reports')
@Controller('service-reports')
export class ServiceReportsController {
  constructor(private readonly serviceReportsService: ServiceReportsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all service reports with pagination and filtering',
  })
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('serviceCategoryId') serviceCategoryId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.serviceReportsService.findAll({
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 10,
      search,
      status,
      serviceCategoryId,
      dateFrom,
      dateTo,
    });
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Download service report PDF' })
  async downloadPdf(@Param('id') id: string, @Res() res: Response) {
    const { buffer, fileName } =
      await this.serviceReportsService.generatePdf(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', buffer.length);
    res.end(buffer);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service report by ID' })
  findOne(@Param('id') id: string) {
    return this.serviceReportsService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new service report' })
  create(@Body() dto: CreateServiceReportDto) {
    return this.serviceReportsService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update existing service report' })
  update(@Param('id') id: string, @Body() dto: UpdateServiceReportDto) {
    return this.serviceReportsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete service report' })
  remove(@Param('id') id: string) {
    return this.serviceReportsService.remove(id);
  }
}
