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
import { InstallationReportsService } from './installation-reports.service';
import { CreateMobileInstallationReportDto } from './dto/create-mobile-installation-report.dto';
import { UpdateMobileInstallationReportDto } from './dto/update-mobile-installation-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('mobile / installation-reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('mobile/installation-reports')
export class MobileInstallationReportsController {
  constructor(
    private readonly installationReportsService: InstallationReportsService,
  ) {}

  // ── List ─────────────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({
    summary:
      '[Mobile] List installation reports assigned to the logged-in engineer',
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
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Alias/fallback for dateFrom — ISO date string `YYYY-MM-DD`',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'Alias/fallback for dateTo — ISO date string `YYYY-MM-DD`',
  })
  @ApiQuery({
    name: 'expenseEligibleOnly',
    required: false,
    type: Boolean,
    description:
      'When true, returns only reports that do not already have an active expense. Use for expense dropdowns.',
  })
  @ApiQuery({
    name: 'excludeExpenseId',
    required: false,
    type: String,
    description:
      'Expense ID to ignore while checking report linkage, used when editing an existing expense.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of installation reports',
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  findAll(
    @Request() req: any,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('expenseEligibleOnly') expenseEligibleOnly?: string,
    @Query('excludeExpenseId') excludeExpenseId?: string,
  ) {
    return this.installationReportsService.findAll(
      {
        skip: skip ? parseInt(skip, 10) : 0,
        take: take ? parseInt(take, 10) : 10,
        search,
        status,
        dateFrom: dateFrom || startDate,
        dateTo: dateTo || endDate,
        expenseEligibleOnly: expenseEligibleOnly === 'true',
        excludeExpenseId,
      },
      req.user,
    );
  }

  // ── Get one ───────────────────────────────────────────────────────────────────

  @Get(':id')
  @ApiOperation({
    summary: '[Mobile] Get a single installation report by ID',
    description:
      'Service Engineers are blocked with 403 if they are not assigned to the report.',
  })
  @ApiResponse({ status: 200, description: 'Installation report detail' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  @ApiResponse({
    status: 403,
    description: 'Not assigned to this installation report',
  })
  @ApiResponse({ status: 404, description: 'Installation report not found' })
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.installationReportsService.findById(id, req.user);
  }

  // ── Create ────────────────────────────────────────────────────────────────────

  @Post()
  @ApiOperation({
    summary: '[Mobile] Create a new installation report',
    description:
      "For Service Engineers the logged-in engineer's ID is automatically " +
      'appended to technician_ids even if omitted from the body.',
  })
  @ApiBody({
    type: CreateMobileInstallationReportDto,
  })
  @ApiResponse({ status: 201, description: 'Installation report created' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  create(@Body() dto: CreateMobileInstallationReportDto, @Request() req: any) {
    return this.installationReportsService.create(dto, req.user);
  }

  // ── Update ────────────────────────────────────────────────────────────────────

  @Put(':id')
  @ApiOperation({
    summary: '[Mobile] Update an existing installation report',
    description:
      'Service Engineers can only update reports they are assigned to.',
  })
  @ApiBody({
    type: UpdateMobileInstallationReportDto,
  })
  @ApiResponse({ status: 200, description: 'Installation report updated' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  @ApiResponse({
    status: 403,
    description: 'Not assigned to this installation report',
  })
  @ApiResponse({ status: 404, description: 'Installation report not found' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMobileInstallationReportDto,
    @Request() req: any,
  ) {
    return this.installationReportsService.update(id, dto, req.user);
  }

  // ── Delete ────────────────────────────────────────────────────────────────────

  @Delete(':id')
  @ApiOperation({
    summary: '[Mobile] Soft-delete an installation report',
    description:
      'Service Engineers can only delete reports they are assigned to.',
  })
  @ApiResponse({ status: 200, description: 'Installation report soft-deleted' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  @ApiResponse({
    status: 403,
    description: 'Not assigned to this installation report',
  })
  @ApiResponse({ status: 404, description: 'Installation report not found' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.installationReportsService.remove(id, req.user);
  }

  // ── PDF ───────────────────────────────────────────────────────────────────────

  @Get(':id/pdf')
  @ApiOperation({
    summary: '[Mobile] Download installation report as PDF',
    description:
      'Service Engineers can only download PDFs for reports they are assigned to.',
  })
  @ApiResponse({ status: 200, description: 'PDF file stream' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  @ApiResponse({
    status: 403,
    description: 'Not assigned to this installation report',
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
}
