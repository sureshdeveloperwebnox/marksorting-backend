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
import { CreateInstallationReportDto } from './dto/create-installation-report.dto';
import { UpdateInstallationReportDto } from './dto/update-installation-report.dto';
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
    type: CreateInstallationReportDto,
    examples: {
      minimal: {
        summary: 'Minimal required fields',
        value: {
          technician_ids: ['xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'],
          customer_id: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
          mill_id: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
          place: 'Coimbatore',
          mill_whatsapp_number: '+919876543210',
          visit_date: '2026-05-26',
          visit_time: '10:30',
          call_registered_date: '2026-05-20',
          machine_model: 'MarkSort Pro 500',
          serial_or_frame_no: 'SN-2026-00123',
          authorized_person: 'Rajesh Kumar',
          engineer_remarks:
            'Machine installed and operating within normal parameters',
          engineer_signature: 'data:image/png;base64,iVBORw0KGgo=',
          customer_signature: 'data:image/png;base64,iVBORw0KGgo=',
        },
      },
      full: {
        summary: 'Full payload with optional fields',
        value: {
          technician_ids: ['xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'],
          customer_id: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
          mill_id: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
          place: 'Coimbatore',
          mill_whatsapp_number: '+919876543210',
          mill_email: 'mill@example.com',
          visit_date: '2026-05-26',
          visit_time: '10:30',
          call_registered_date: '2026-05-20',
          machine_model: 'MarkSort Pro 500',
          serial_or_frame_no: 'SN-2026-00123',
          authorized_person: 'Rajesh Kumar',
          invoice_number: 'IR-INV-100234',
          invoice_date: '2026-05-15',
          warranty_start_date: '2026-05-26',
          warranty_end_date: '2027-05-26',
          commodity: 'Rice',
          contamination: '2%',
          output_capacity_per_hour: '500 kg/hr',
          rejection_ratio: '0.5%',
          purity: '99.5%',
          no_of_programs_set: 5,
          ac_provided: true,
          compressor_details: 'Atlas Copco GA11, 11 kW',
          air_drier_details: 'Refrigerated type, working fine',
          ground_earth_provided: true,
          ground_earth_value: 3,
          ground_earth_field: 'PRIMARY',
          no_of_filters_installed: 3,
          oil_filter_condition: 'Good',
          line_filter_condition: 'Clean',
          auto_drain_valve_working: true,
          engineer_remarks:
            'Machine installed and operating within normal parameters',
          customer_remarks: 'Satisfied with the installation',
          engineer_signature: 'data:image/png;base64,iVBORw0KGgo=',
          customer_signature: 'data:image/png;base64,iVBORw0KGgo=',
          status: 'COMPLETED',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Installation report created' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  create(@Body() dto: CreateInstallationReportDto, @Request() req: any) {
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
    type: UpdateInstallationReportDto,
    examples: {
      status_update: {
        summary: 'Update status only',
        value: {
          status: 'COMPLETED',
        },
      },
      partial_update: {
        summary: 'Update remarks and warranty dates',
        value: {
          engineer_remarks: 'Machine fully operational after reconfiguration',
          customer_remarks: 'Very satisfied with the installation',
          warranty_start_date: '2026-05-26',
          warranty_end_date: '2027-05-26',
          status: 'COMPLETED',
          engineer_signature: 'data:image/png;base64,iVBORw0KGgo=',
          customer_signature: 'data:image/png;base64,iVBORw0KGgo=',
        },
      },
    },
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
    @Body() dto: UpdateInstallationReportDto,
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
