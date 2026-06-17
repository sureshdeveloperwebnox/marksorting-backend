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
import { LogActivity } from '../activity-logs/decorators/log-activity.decorator';
import { ActivityAction } from '../activity-logs/enums/activity-action.enum';
import {
  updateDescription,
  deleteDescription,
  buildDiffSummary,
} from '../activity-logs/helpers/description.helper';

@ApiTags('service-reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('service-reports')
export class ServiceReportsController {
  constructor(private readonly serviceReportsService: ServiceReportsService) { }

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
  @ApiQuery({
    name: 'technicianId',
    required: false,
    type: String,
    description: 'Filter by technician/service engineer ID',
  })
  @ApiQuery({
    name: 'customerId',
    required: false,
    type: String,
    description: 'Filter by customer ID',
  })
  @ApiQuery({
    name: 'millId',
    required: false,
    type: String,
    description: 'Filter by mill ID',
  })
  findAll(
    @Request() req: any,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('serviceCategoryId') serviceCategoryId?: string,
    @Query('technicianId') technicianId?: string,
    @Query('customerId') customerId?: string,
    @Query('millId') millId?: string,
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
        technicianId,
        customerId,
        millId,
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
  @LogActivity({
    action: ActivityAction.EXPORT,
    entityType: 'service_reports',
    entityIdParam: 'id',
    description: (ctx) =>
      `Downloaded PDF for service report ${ctx.params.id} — file exported`,
  })
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
  @LogActivity({
    action: ActivityAction.CREATE,
    entityType: 'service_reports',
    description: (ctx) => {
      const report = ctx.result;
      const repNo = report?.report_number || 'N/A';
      const parts = [
        report?.machine_model || ctx.body.machine_model
          ? `Machine: ${report?.machine_model || ctx.body.machine_model}`
          : null,
        report?.place || ctx.body.place
          ? `Place: ${report?.place || ctx.body.place}`
          : null,
        report?.mill?.name ? `Mill: ${report.mill.name}` : null,
        report?.status ? `Status: ${report.status}` : null,
      ]
        .filter(Boolean)
        .join(', ');
      const who = ctx.user.full_name
        ? `${ctx.user.full_name} created`
        : 'Created';
      return `${who} Service Report "${repNo}"` + (parts ? ` — ${parts}` : '');
    },
  })
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
  @LogActivity({
    action: ActivityAction.UPDATE,
    entityType: 'service_reports',
    entityIdParam: 'id',
    description: (ctx) => {
      const before = ctx.result?.before;
      const after = ctx.result?.after;
      const repNo =
        after?.report_number || before?.report_number || ctx.params.id;
      const diff =
        before && after ? buildDiffSummary(before, after, ctx.body) : '';
      const who = ctx.user.full_name
        ? `${ctx.user.full_name} updated`
        : 'Updated';
      return diff
        ? `${who} Service Report "${repNo}" — ${diff}`
        : `${who} Service Report "${repNo}" (no changes detected)`;
    },
  })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateServiceReportDto,
    @Request() req: any,
  ) {
    // Reload trigger to compile latest DTO updates.
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
  @LogActivity({
    action: ActivityAction.DELETE,
    entityType: 'service_reports',
    entityIdParam: 'id',
    description: (ctx) => {
      const report = ctx.result;
      const repNo = report?.report_number || ctx.params.id;
      return deleteDescription('Service Report', repNo, ctx.user.full_name);
    },
  })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.serviceReportsService.remove(id, req.user);
  }
}
