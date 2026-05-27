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
  ApiBody,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { ServiceReportsService } from './service-reports.service';
import { CreateMobileServiceReportDto } from './dto/create-mobile-service-report.dto';
import { UpdateMobileServiceReportDto } from './dto/update-mobile-service-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('mobile / service-reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('mobile/service-reports')
export class MobileServiceReportsController {
  constructor(private readonly serviceReportsService: ServiceReportsService) {}

  // ── List ─────────────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({
    summary: '[Mobile] List service reports assigned to the logged-in engineer',
    description:
      'Service Engineers only see reports they are assigned to. ' +
      'Other roles (Admin, Manager, etc.) see all reports.',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    type: String,
    description: 'Offset (default 0)',
  })
  @ApiQuery({
    name: 'take',
    required: false,
    type: String,
    description: 'Page size (default 10)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by report number, place, serial no, machine model',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description:
      'Filter by status: PENDING | IN_PROGRESS | COMPLETED | CANCELLED',
  })
  @ApiQuery({
    name: 'serviceCategoryId',
    required: false,
    type: String,
    description: 'Filter by service category UUID',
  })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    type: String,
    description: 'Visit date from (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    type: String,
    description: 'Visit date to (YYYY-MM-DD)',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of service reports',
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
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

  // ── Get one ───────────────────────────────────────────────────────────────────

  @Get(':id')
  @ApiOperation({
    summary: '[Mobile] Get a single service report by ID',
    description:
      'Service Engineers are blocked with 403 if they are not assigned to the report.',
  })
  @ApiResponse({ status: 200, description: 'Service report detail' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  @ApiResponse({
    status: 403,
    description: 'Not assigned to this service report',
  })
  @ApiResponse({ status: 404, description: 'Service report not found' })
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.serviceReportsService.findById(id, req.user);
  }

  // ── Create ────────────────────────────────────────────────────────────────────

  @Post()
  @ApiOperation({
    summary: '[Mobile] Create a new service report',
    description:
      "For Service Engineers the logged-in engineer's ID is automatically " +
      'appended to technician_ids even if omitted from the body.',
  })
  @ApiBody({
    type: CreateMobileServiceReportDto,
  })
  @ApiResponse({ status: 201, description: 'Service report created' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  create(@Body() dto: CreateMobileServiceReportDto, @Request() req: any) {
    return this.serviceReportsService.create(dto, req.user);
  }

  // ── Update ────────────────────────────────────────────────────────────────────

  @Put(':id')
  @ApiOperation({
    summary: '[Mobile] Update an existing service report',
    description:
      'Service Engineers can only update reports they are assigned to.',
  })
  @ApiBody({
    type: UpdateMobileServiceReportDto,
  })
  @ApiResponse({ status: 200, description: 'Service report updated' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  @ApiResponse({
    status: 403,
    description: 'Not assigned to this service report',
  })
  @ApiResponse({ status: 404, description: 'Service report not found' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMobileServiceReportDto,
    @Request() req: any,
  ) {
    return this.serviceReportsService.update(id, dto, req.user);
  }

  // ── Delete ────────────────────────────────────────────────────────────────────

  @Delete(':id')
  @ApiOperation({
    summary: '[Mobile] Soft-delete a service report',
    description:
      'Service Engineers can only delete reports they are assigned to.',
  })
  @ApiResponse({ status: 200, description: 'Service report soft-deleted' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  @ApiResponse({
    status: 403,
    description: 'Not assigned to this service report',
  })
  @ApiResponse({ status: 404, description: 'Service report not found' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.serviceReportsService.remove(id, req.user);
  }

  // ── PDF ───────────────────────────────────────────────────────────────────────

  @Get(':id/pdf')
  @ApiOperation({
    summary: '[Mobile] Download service report as PDF',
    description:
      'Service Engineers can only download PDFs for reports they are assigned to.',
  })
  @ApiResponse({ status: 200, description: 'PDF file stream' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  @ApiResponse({
    status: 403,
    description: 'Not assigned to this service report',
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
}
