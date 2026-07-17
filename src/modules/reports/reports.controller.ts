import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LogActivity } from '../activity-logs/decorators/log-activity.decorator';
import { ActivityAction } from '../activity-logs/enums/activity-action.enum';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('services')
  @ApiOperation({ summary: 'Get service reports log or export it' })
  @LogActivity({
    action: ActivityAction.EXPORT,
    entityType: 'reports',
    description: (ctx) => {
      const exportType = ctx.query.export;
      return exportType
        ? `Exported service reports as ${exportType.toUpperCase()}`
        : 'Viewed service reports list';
    },
    ignoreNullEntity: true,
  })
  @ApiQuery({ name: 'skip', required: false, type: String })
  @ApiQuery({ name: 'take', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'dateFrom', required: false, type: String })
  @ApiQuery({ name: 'dateTo', required: false, type: String })
  @ApiQuery({ name: 'millId', required: false, type: String })
  @ApiQuery({ name: 'technicianId', required: false, type: String })
  @ApiQuery({ name: 'millName', required: false, type: String })
  @ApiQuery({ name: 'frameNo', required: false, type: String })
  @ApiQuery({
    name: 'export',
    required: false,
    type: String,
    description: 'pdf, csv, excel',
  })
  async getServices(
    @Request() req: any,
    @Res() res: Response,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('categoryId') categoryId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('millId') millId?: string,
    @Query('technicianId') technicianId?: string,
    @Query('millName') millName?: string,
    @Query('frameNo') frameNo?: string,
    @Query('export') exportType?: 'pdf' | 'csv' | 'excel',
  ) {
    const params = {
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 10,
      search,
      status,
      categoryId,
      dateFrom,
      dateTo,
      millId,
      technicianId,
      millName,
      frameNo,
    };

    if (exportType) {
      const { buffer, fileName, contentType } =
        await this.reportsService.exportServices(params, req.user, exportType);
      res.setHeader('Content-Type', contentType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileName}"`,
      );
      res.setHeader('Content-Length', buffer.length);
      return res.end(buffer);
    }

    const data = await this.reportsService.getServices(params, req.user);
    return res.json(data);
  }

  @Get('installations')
  @ApiOperation({ summary: 'Get installation reports log or export it' })
  @LogActivity({
    action: ActivityAction.EXPORT,
    entityType: 'reports',
    description: (ctx) => {
      const exportType = ctx.query.export;
      return exportType
        ? `Exported installation reports as ${exportType.toUpperCase()}`
        : 'Viewed installation reports list';
    },
    ignoreNullEntity: true,
  })
  @ApiQuery({ name: 'skip', required: false, type: String })
  @ApiQuery({ name: 'take', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'dateFrom', required: false, type: String })
  @ApiQuery({ name: 'dateTo', required: false, type: String })
  @ApiQuery({ name: 'millId', required: false, type: String })
  @ApiQuery({ name: 'technicianId', required: false, type: String })
  @ApiQuery({ name: 'millName', required: false, type: String })
  @ApiQuery({ name: 'frameNo', required: false, type: String })
  @ApiQuery({
    name: 'export',
    required: false,
    type: String,
    description: 'pdf, csv, excel',
  })
  async getInstallations(
    @Request() req: any,
    @Res() res: Response,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('millId') millId?: string,
    @Query('technicianId') technicianId?: string,
    @Query('millName') millName?: string,
    @Query('frameNo') frameNo?: string,
    @Query('export') exportType?: 'pdf' | 'csv' | 'excel',
  ) {
    const params = {
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 10,
      search,
      status,
      dateFrom,
      dateTo,
      millId,
      technicianId,
      millName,
      frameNo,
    };

    if (exportType) {
      const { buffer, fileName, contentType } =
        await this.reportsService.exportInstallations(
          params,
          req.user,
          exportType,
        );
      res.setHeader('Content-Type', contentType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileName}"`,
      );
      res.setHeader('Content-Length', buffer.length);
      return res.end(buffer);
    }

    const data = await this.reportsService.getInstallations(params, req.user);
    return res.json(data);
  }

  @Get('expenses')
  @ApiOperation({ summary: 'Get expense reports log or export it' })
  @LogActivity({
    action: ActivityAction.EXPORT,
    entityType: 'reports',
    description: (ctx) => {
      const exportType = ctx.query.export;
      return exportType
        ? `Exported expense reports as ${exportType.toUpperCase()}`
        : 'Viewed expense reports list';
    },
    ignoreNullEntity: true,
  })
  @ApiQuery({ name: 'skip', required: false, type: String })
  @ApiQuery({ name: 'take', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'dateFrom', required: false, type: String })
  @ApiQuery({ name: 'dateTo', required: false, type: String })
  @ApiQuery({ name: 'millId', required: false, type: String })
  @ApiQuery({ name: 'technicianId', required: false, type: String })
  @ApiQuery({ name: 'millName', required: false, type: String })
  @ApiQuery({ name: 'frameNo', required: false, type: String })
  @ApiQuery({
    name: 'export',
    required: false,
    type: String,
    description: 'pdf, csv, excel',
  })
  async getExpenses(
    @Request() req: any,
    @Res() res: Response,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('categoryId') categoryId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('millId') millId?: string,
    @Query('technicianId') technicianId?: string,
    @Query('millName') millName?: string,
    @Query('frameNo') frameNo?: string,
    @Query('export') exportType?: 'pdf' | 'csv' | 'excel',
  ) {
    const params = {
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 10,
      search,
      status,
      categoryId,
      dateFrom,
      dateTo,
      millId,
      technicianId,
      millName,
      frameNo,
    };

    if (exportType) {
      const { buffer, fileName, contentType } =
        await this.reportsService.exportExpenses(params, req.user, exportType);
      res.setHeader('Content-Type', contentType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileName}"`,
      );
      res.setHeader('Content-Length', buffer.length);
      return res.end(buffer);
    }

    const data = await this.reportsService.getExpenses(params, req.user);
    return res.json(data);
  }

  @Get('master-mills')
  @ApiOperation({ summary: 'Get master mills reports log or export it' })
  @LogActivity({
    action: ActivityAction.EXPORT,
    entityType: 'reports',
    description: (ctx) => {
      const exportType = ctx.query.export;
      return exportType
        ? `Exported master mills reports as ${exportType.toUpperCase()}`
        : 'Viewed master mills reports list';
    },
    ignoreNullEntity: true,
  })
  @ApiQuery({ name: 'skip', required: false, type: String })
  @ApiQuery({ name: 'take', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'dateFrom', required: false, type: String })
  @ApiQuery({ name: 'dateTo', required: false, type: String })
  @ApiQuery({ name: 'millId', required: false, type: String })
  @ApiQuery({ name: 'millName', required: false, type: String })
  @ApiQuery({ name: 'frameNo', required: false, type: String })
  @ApiQuery({
    name: 'export',
    required: false,
    type: String,
    description: 'pdf, csv, excel',
  })
  async getMasterMills(
    @Request() req: any,
    @Res() res: Response,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('millId') millId?: string,
    @Query('millName') millName?: string,
    @Query('frameNo') frameNo?: string,
    @Query('export') exportType?: 'pdf' | 'csv' | 'excel',
  ) {
    const params = {
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 10,
      search,
      status,
      dateFrom,
      dateTo,
      millId,
      millName,
      frameNo,
    };

    if (exportType) {
      const { buffer, fileName, contentType } =
        await this.reportsService.exportMasterMills(
          params,
          req.user,
          exportType,
        );
      res.setHeader('Content-Type', contentType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileName}"`,
      );
      res.setHeader('Content-Length', buffer.length);
      return res.end(buffer);
    }

    const data = await this.reportsService.getMasterMills(params, req.user);
    return res.json(data);
  }

  @Get('stores')
  @ApiOperation({ summary: 'Get store reports log or export it' })
  @LogActivity({
    action: ActivityAction.EXPORT,
    entityType: 'reports',
    description: (ctx) => {
      const exportType = ctx.query.export;
      return exportType
        ? `Exported store reports as ${exportType.toUpperCase()}`
        : 'Viewed store reports list';
    },
    ignoreNullEntity: true,
  })
  @ApiQuery({ name: 'skip', required: false, type: String })
  @ApiQuery({ name: 'take', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'serviceEngineerId', required: false, type: String })
  @ApiQuery({ name: 'customerId', required: false, type: String })
  @ApiQuery({ name: 'materialId', required: false, type: String })
  @ApiQuery({ name: 'warrantyStatus', required: false, type: String })
  @ApiQuery({ name: 'returnStatus', required: false, type: String })
  @ApiQuery({ name: 'inflowStatus', required: false, type: String })
  @ApiQuery({ name: 'dateFrom', required: false, type: String })
  @ApiQuery({ name: 'dateTo', required: false, type: String })
  @ApiQuery({
    name: 'export',
    required: false,
    type: String,
    description: 'pdf, csv, excel',
  })
  async getStores(
    @Request() req: any,
    @Res() res: Response,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('serviceEngineerId') serviceEngineerId?: string,
    @Query('customerId') customerId?: string,
    @Query('materialId') materialId?: string,
    @Query('warrantyStatus') warrantyStatus?: string,
    @Query('returnStatus') returnStatus?: string,
    @Query('inflowStatus') inflowStatus?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('export') exportType?: 'pdf' | 'csv' | 'excel',
  ) {
    const params = {
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 10,
      search,
      serviceEngineerId,
      customerId,
      materialId,
      warrantyStatus,
      returnStatus,
      inflowStatus,
      dateFrom,
      dateTo,
    };

    if (exportType) {
      const resData = await this.reportsService.exportStores(
        params,
        req.user,
        exportType,
      );
      if (resData) {
        const { buffer, fileName, contentType } = resData;
        res.setHeader('Content-Type', contentType);
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${fileName}"`,
        );
        res.setHeader('Content-Length', buffer.length);
        return res.end(buffer);
      }
      return res.status(400).json({ message: 'Failed to export store reports' });
    }

    const data = await this.reportsService.getStores(params, req.user);
    return res.json(data);
  }
}
