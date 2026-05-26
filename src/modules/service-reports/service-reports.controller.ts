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
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { ServiceReportsService } from './service-reports.service';
import { CreateServiceReportDto } from './dto/create-service-report.dto';
import { UpdateServiceReportDto } from './dto/update-service-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('service-reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('service-reports')
export class ServiceReportsController {
  constructor(private readonly serviceReportsService: ServiceReportsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all service reports with pagination and filtering',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    type: String,
    description: 'Number of records to skip',
  })
  @ApiQuery({
    name: 'take',
    required: false,
    type: String,
    description: 'Number of records to take',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search term for name, place, serial no, machine model',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'serviceCategoryId',
    required: false,
    type: String,
    description: 'Filter by category ID',
  })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    type: String,
    description: 'Filter from visit date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    type: String,
    description: 'Filter to visit date (YYYY-MM-DD)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of service reports successfully retrieved',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  findAll(
    @Request() req: any,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('serviceCategoryId') serviceCategoryId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.serviceReportsService.findAll(
      {
        skip: skip ? parseInt(skip, 10) : 0,
        take: take ? parseInt(take, 10) : 10,
        search,
        status,
        serviceCategoryId,
        dateFrom,
        dateTo,
      },
      req.user,
    );
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Download service report PDF' })
  @ApiResponse({ status: 200, description: 'Service report PDF file' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden access to this service report',
  })
  @ApiResponse({ status: 404, description: 'Service report not found' })
  async downloadPdf(
    @Param('id') id: string,
    @Request() req: any,
    @Res() res: Response,
  ) {
    const { buffer, fileName } = await this.serviceReportsService.generatePdf(
      id,
      req.user,
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', buffer.length);
    res.end(buffer);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service report by ID' })
  @ApiResponse({
    status: 200,
    description: 'Service report details successfully retrieved',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden access to this service report',
  })
  @ApiResponse({ status: 404, description: 'Service report not found' })
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.serviceReportsService.findById(id, req.user);
  }

  @Post()
  @ApiOperation({ summary: 'Create new service report' })
  @ApiResponse({
    status: 201,
    description: 'Service report successfully created',
  })
  @ApiResponse({ status: 400, description: 'Invalid input payload' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  create(@Body() dto: CreateServiceReportDto, @Request() req: any) {
    return this.serviceReportsService.create(dto, req.user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update existing service report' })
  @ApiResponse({
    status: 200,
    description: 'Service report successfully updated',
  })
  @ApiResponse({ status: 400, description: 'Invalid input payload' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden access to edit this service report',
  })
  @ApiResponse({ status: 404, description: 'Service report not found' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateServiceReportDto,
    @Request() req: any,
  ) {
    return this.serviceReportsService.update(id, dto, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete service report' })
  @ApiResponse({
    status: 200,
    description: 'Service report successfully deleted',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden access to delete this service report',
  })
  @ApiResponse({ status: 404, description: 'Service report not found' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.serviceReportsService.remove(id, req.user);
  }
}
