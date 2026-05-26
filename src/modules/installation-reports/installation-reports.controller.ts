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
import { InstallationReportsService } from './installation-reports.service';
import { CreateInstallationReportDto } from './dto/create-installation-report.dto';
import { UpdateInstallationReportDto } from './dto/update-installation-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('installation-reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('installation-reports')
export class InstallationReportsController {
  constructor(
    private readonly installationReportsService: InstallationReportsService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get all installation reports with pagination and filtering',
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
    description:
      'Search term for report number, place, machine model, serial no',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: 'Filter by status',
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
    description: 'List of installation reports successfully retrieved',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  findAll(
    @Request() req: any,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.installationReportsService.findAll(
      {
        skip: skip ? parseInt(skip, 10) : 0,
        take: take ? parseInt(take, 10) : 10,
        search,
        status,
        dateFrom,
        dateTo,
      },
      req.user,
    );
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Download installation report PDF' })
  @ApiResponse({ status: 200, description: 'Installation report PDF file' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden access to this installation report',
  })
  @ApiResponse({ status: 404, description: 'Installation report not found' })
  async downloadPdf(
    @Param('id') id: string,
    @Request() req: any,
    @Res() res: Response,
  ) {
    const { buffer, fileName } =
      await this.installationReportsService.generatePdf(id, req.user);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', buffer.length);
    res.end(buffer);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get installation report by ID' })
  @ApiResponse({
    status: 200,
    description: 'Installation report details successfully retrieved',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden access to this installation report',
  })
  @ApiResponse({ status: 404, description: 'Installation report not found' })
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.installationReportsService.findById(id, req.user);
  }

  @Post()
  @ApiOperation({ summary: 'Create new installation report' })
  @ApiResponse({
    status: 201,
    description: 'Installation report successfully created',
  })
  @ApiResponse({ status: 400, description: 'Invalid input payload' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  create(@Body() dto: CreateInstallationReportDto, @Request() req: any) {
    return this.installationReportsService.create(dto, req.user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update existing installation report' })
  @ApiResponse({
    status: 200,
    description: 'Installation report successfully updated',
  })
  @ApiResponse({ status: 400, description: 'Invalid input payload' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden access to edit this installation report',
  })
  @ApiResponse({ status: 404, description: 'Installation report not found' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateInstallationReportDto,
    @Request() req: any,
  ) {
    return this.installationReportsService.update(id, dto, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete installation report' })
  @ApiResponse({
    status: 200,
    description: 'Installation report successfully deleted',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden access to delete this installation report',
  })
  @ApiResponse({ status: 404, description: 'Installation report not found' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.installationReportsService.remove(id, req.user);
  }
}
