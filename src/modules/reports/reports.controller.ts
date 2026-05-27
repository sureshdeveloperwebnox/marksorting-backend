import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';
import type { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('services')
  @ApiOperation({ summary: 'Get service reports log or export it' })
  @ApiQuery({ name: 'skip', required: false, type: String })
  @ApiQuery({ name: 'take', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'dateFrom', required: false, type: String })
  @ApiQuery({ name: 'dateTo', required: false, type: String })
  @ApiQuery({ name: 'export', required: false, type: String, description: 'pdf, csv, excel' })
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
    };

    if (exportType) {
      const { buffer, fileName, contentType } = await this.reportsService.exportServices(params, req.user, exportType);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', buffer.length);
      return res.end(buffer);
    }

    const data = await this.reportsService.getServices(params, req.user);
    return res.json(data);
  }

  @Get('installations')
  @ApiOperation({ summary: 'Get installation reports log or export it' })
  @ApiQuery({ name: 'skip', required: false, type: String })
  @ApiQuery({ name: 'take', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'dateFrom', required: false, type: String })
  @ApiQuery({ name: 'dateTo', required: false, type: String })
  @ApiQuery({ name: 'export', required: false, type: String, description: 'pdf, csv, excel' })
  async getInstallations(
    @Request() req: any,
    @Res() res: Response,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('export') exportType?: 'pdf' | 'csv' | 'excel',
  ) {
    const params = {
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 10,
      search,
      status,
      dateFrom,
      dateTo,
    };

    if (exportType) {
      const { buffer, fileName, contentType } = await this.reportsService.exportInstallations(params, req.user, exportType);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', buffer.length);
      return res.end(buffer);
    }

    const data = await this.reportsService.getInstallations(params, req.user);
    return res.json(data);
  }

  @Get('expenses')
  @ApiOperation({ summary: 'Get expense reports log or export it' })
  @ApiQuery({ name: 'skip', required: false, type: String })
  @ApiQuery({ name: 'take', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'dateFrom', required: false, type: String })
  @ApiQuery({ name: 'dateTo', required: false, type: String })
  @ApiQuery({ name: 'export', required: false, type: String, description: 'pdf, csv, excel' })
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
    };

    if (exportType) {
      const { buffer, fileName, contentType } = await this.reportsService.exportExpenses(params, req.user, exportType);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', buffer.length);
      return res.end(buffer);
    }

    const data = await this.reportsService.getExpenses(params, req.user);
    return res.json(data);
  }
}
