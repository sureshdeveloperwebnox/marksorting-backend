import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth, ApiResponse, ApiBody } from '@nestjs/swagger';
import { MasterMillsService } from './master-mills.service';
import { Prisma } from '@prisma/client';
import { CreateMasterMillDto } from './dto/create-master-mill.dto';
import { UpdateMasterMillDto } from './dto/update-master-mill.dto';
import { QuickRegisterDto } from './dto/quick-register.dto';
import { LogActivity } from '../activity-logs/decorators/log-activity.decorator';
import { ActivityAction } from '../activity-logs/enums/activity-action.enum';
import {
  createDescription,
  updateDescription,
  deleteDescription,
  buildDiffSummary,
} from '../activity-logs/helpers/description.helper';

@ApiTags('master-mills')
@ApiBearerAuth()
@Controller('master-mills')
export class MasterMillsController {
  constructor(private readonly masterMillsService: MasterMillsService) { }

  @Get()
  @ApiOperation({ summary: 'Get all master mill records with pagination and filtering' })
  @ApiQuery({ name: 'skip', required: false, type: String })
  @ApiQuery({ name: 'take', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'state', required: false, type: String })
  @ApiQuery({ name: 'all_warranty', required: false, type: String })
  @ApiQuery({ name: 'mill_id', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiQuery({ name: 'dateFrom', required: false, type: String, description: 'Filter from installation date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dateTo', required: false, type: String, description: 'Filter to installation date (YYYY-MM-DD)' })
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('state') state?: string,
    @Query('all_warranty') allWarranty?: string,
    @Query('mill_id') millId?: string,
    @Query('type') type?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const where: Prisma.MasterMillWhereInput = {};

    if (search) {
      const orConditions: Prisma.MasterMillWhereInput[] = [
        { invoice_no: { contains: search, mode: 'insensitive' } },
        { ref_no: { contains: search, mode: 'insensitive' } },
        { mc_model: { contains: search, mode: 'insensitive' } },
        { frame_no: { contains: search, mode: 'insensitive' } },
        { place: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        // Also search by the parent Mill's ref_no and name (handles cases where MasterMill.ref_no is empty)
        { mill: { name: { contains: search, mode: 'insensitive' } } },
        { mill: { ref_no: { contains: search, mode: 'insensitive' } } },
      ];

      const cleanedPhone = search.replace(/[^\d+]/g, '');
      if (cleanedPhone && cleanedPhone !== '+') {
        orConditions.push({ phone_no: { contains: cleanedPhone, mode: 'insensitive' } });
      }

      where.OR = orConditions;
    }

    if (status) where.status = status;
    if (state) where.state = state;

    if (allWarranty) {
      where.all_warranty = allWarranty;
    }

    if (millId) where.mill_id = millId;
    if (type) where.type = type;

    if (dateFrom || dateTo) {
      where.installation_date = {};
      if (dateFrom) {
        const [fy, fm, fd] = dateFrom.split('-').map(Number);
        const from = new Date(fy, fm - 1, fd, 0, 0, 0, 0);
        (where.installation_date as any).gte = from;
      }
      if (dateTo) {
        const [ty, tm, td] = dateTo.split('-').map(Number);
        const to = new Date(ty, tm - 1, td, 23, 59, 59, 999);
        (where.installation_date as any).lte = to;
      }
    }

    return this.masterMillsService.findAll({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      where,
      orderBy: { created_at: 'desc' },
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get master mill statistics' })
  getStats() {
    return this.masterMillsService.getStats();
  }

  @Get('prefill')
  @ApiOperation({ summary: 'Search machine records by Ref No or Frame No for prefilling forms' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'ref_no', required: false, type: String })
  @ApiQuery({ name: 'frame_no', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Matched master mill records' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  findForPrefill(
    @Query('search') search?: string,
    @Query('ref_no') refNo?: string,
    @Query('frame_no') frameNo?: string,
  ) {
    return this.masterMillsService.findForPrefill(search, refNo, frameNo);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get master mill record by ID' })
  findOne(@Param('id') id: string) {
    return this.masterMillsService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new master mill record' })
  @LogActivity({
    action: ActivityAction.CREATE,
    entityType: 'master_mills',
    description: (ctx) => {
      const record = ctx.result;
      const invoiceNo = record?.invoice_no || ctx.body.invoice_no || 'Unknown';
      const details = [
        record?.mill?.name ? `Mill: ${record.mill.name}` : null,
        record?.mc_model ? `Model: ${record.mc_model}` : null,
        record?.state ? `State: ${record.state}` : null,
      ]
        .filter(Boolean)
        .join(', ');
      return createDescription('Master Mill', invoiceNo, details || undefined, ctx.user.full_name);
    },
  })
  create(@Body() dto: CreateMasterMillDto) {
    return this.masterMillsService.create(dto);
  }

  @Post('quick-register')
  @ApiOperation({ summary: 'Quick register Customer, Mill, and Master Mill' })
  @ApiBody({ type: QuickRegisterDto })
  @ApiResponse({ status: 201, description: 'Quick registration successful' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @LogActivity({
    action: ActivityAction.CREATE,
    entityType: 'master_mills',
    description: (ctx) => {
      const record = ctx.result;
      const invoiceNo = record?.invoice_no || 'Unknown';
      const details = [
        record?.mill?.name ? `Mill: ${record.mill.name}` : null,
        record?.mc_model ? `Model: ${record.mc_model}` : null,
        record?.state ? `State: ${record.state}` : null,
      ]
        .filter(Boolean)
        .join(', ');
      return createDescription('Master Mill (Quick Register)', invoiceNo, details || undefined, ctx.user.full_name);
    },
  })
  quickRegister(@Body() dto: QuickRegisterDto) {
    return this.masterMillsService.quickRegister(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update master mill record' })
  @LogActivity({
    action: ActivityAction.UPDATE,
    entityType: 'master_mills',
    entityIdParam: 'id',
    description: (ctx) => {
      const before = ctx.result?.before;
      const after = ctx.result?.after;
      const name = after?.invoice_no || before?.invoice_no || ctx.params.id;
      const diff = before && after ? buildDiffSummary(before, after, ctx.body) : '';
      const who = ctx.user.full_name ? `${ctx.user.full_name} updated` : 'Updated';
      return diff
        ? `${who} Master Mill "${name}" — ${diff}`
        : `${who} Master Mill "${name}" (no changes detected)`;
    },
  })
  update(@Param('id') id: string, @Body() dto: UpdateMasterMillDto) {
    return this.masterMillsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete master mill record' })
  @LogActivity({
    action: ActivityAction.DELETE,
    entityType: 'master_mills',
    entityIdParam: 'id',
    description: (ctx) => {
      const record = ctx.result;
      const name = record?.invoice_no || ctx.params.id;
      return deleteDescription('Master Mill', name, ctx.user.full_name);
    },
  })
  remove(@Param('id') id: string) {
    return this.masterMillsService.remove(id);
  }
}
