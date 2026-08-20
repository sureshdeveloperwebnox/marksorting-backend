import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { StoresService } from './stores.service';
import { Prisma } from '@prisma/client';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { UpdateStoreReturnDto } from './dto/update-store-return.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LogActivity } from '../activity-logs/decorators/log-activity.decorator';
import { ActivityAction } from '../activity-logs/enums/activity-action.enum';
import {
  createDescription,
  updateDescription,
  deleteDescription,
  buildDiffSummary,
} from '../activity-logs/helpers/description.helper';

@ApiTags('stores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all store records with pagination and filtering',
  })
  @ApiResponse({ status: 200, description: 'Paginated list of store records' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
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
    description: 'Search by frame number, barcode, engineer, or customer',
  })
  @ApiQuery({
    name: 'service_engineer_id',
    required: false,
    type: String,
    description: 'Filter by service engineer UUID',
  })
  @ApiQuery({
    name: 'customer_id',
    required: false,
    type: String,
    description: 'Filter by customer UUID',
  })
  @ApiQuery({
    name: 'material_id',
    required: false,
    type: String,
    description: 'Filter by material UUID',
  })
  @ApiQuery({
    name: 'warranty_status',
    required: false,
    type: String,
    description: 'Filter by warranty status',
  })
  @ApiQuery({
    name: 'return_status',
    required: false,
    type: String,
    description: 'Filter by return status',
  })
  @ApiQuery({
    name: 'inflow_status',
    required: false,
    type: String,
    description: 'Filter by inflow/stock status',
  })
  @ApiQuery({
    name: 'stock_type',
    required: false,
    type: String,
    description: 'Filter by stock type (Inflow / From Store)',
  })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    type: String,
    description: 'Filter from created date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    type: String,
    description: 'Filter to created date (YYYY-MM-DD)',
  })
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('service_engineer_id') serviceEngineerId?: string,
    @Query('serviceEngineerId') serviceEngineerIdCamel?: string,
    @Query('customer_id') customerId?: string,
    @Query('customerId') customerIdCamel?: string,
    @Query('material_id') materialId?: string,
    @Query('materialId') materialIdCamel?: string,
    @Query('warranty_status') warrantyStatus?: string,
    @Query('warrantyStatus') warrantyStatusCamel?: string,
    @Query('return_status') returnStatus?: string,
    @Query('returnStatus') returnStatusCamel?: string,
    @Query('inflow_status') inflowStatus?: string,
    @Query('inflowStatus') inflowStatusCamel?: string,
    @Query('stock_type') stockType?: string,
    @Query('stockType') stockTypeCamel?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const where: Prisma.StoreWhereInput = {};

    const engId = serviceEngineerId || serviceEngineerIdCamel;
    const custId = customerId || customerIdCamel;
    const matId = materialId || materialIdCamel;
    const warStatus = warrantyStatus || warrantyStatusCamel;
    const retStatus = returnStatus || returnStatusCamel;
    const infStatus = inflowStatus || inflowStatusCamel;
    const stkType = stockType || stockTypeCamel;

    if (search) {
      where.OR = [
        { store_number: { contains: search, mode: 'insensitive' } },
        { frame_number: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
        {
          service_engineer: {
            full_name: { contains: search, mode: 'insensitive' },
          },
        },
        {
          customer: {
            name: { contains: search, mode: 'insensitive' },
          },
        },
      ];
    }

    if (engId) {
      where.service_engineer_id = engId;
    }

    if (custId) {
      where.customer_id = custId;
    }

    if (warStatus) {
      where.warranty_status = { equals: warStatus, mode: 'insensitive' };
    }

    if (retStatus) {
      const lower = retStatus.toLowerCase();
      if (lower === 'returned' || lower === 'completed') {
        where.return_status = { in: ['Returned', 'Completed'] };
      } else if (lower === 'pending') {
        where.return_status = 'Pending';
      } else if (lower === 'in progress' || lower === 'in_progress') {
        where.return_status = 'In Progress';
      } else if (lower === 'not returned' || lower === 'not_returned') {
        where.return_status = 'Not Returned';
      } else {
        where.return_status = { equals: retStatus, mode: 'insensitive' };
      }
    }

    if (infStatus) {
      where.inflow_status = { equals: infStatus, mode: 'insensitive' };
    }

    if (stkType) {
      where.stock_type = { equals: stkType, mode: 'insensitive' };
    }

    if (materialId) {
      where.materials = {
        some: {
          material_id: materialId,
        },
      };
    }

    if (dateFrom || dateTo) {
      where.created_at = {};
      if (dateFrom) {
        // Use multi-arg constructor so the date is interpreted in the server's
        // local timezone (matching how stored timestamps are represented),
        // instead of new Date("yyyy-MM-dd") which parses as UTC midnight.
        const [fy, fm, fd] = dateFrom.split('-').map(Number);
        const from = new Date(fy, fm - 1, fd, 0, 0, 0, 0);
        (where.created_at as any).gte = from;
      }
      if (dateTo) {
        const [ty, tm, td] = dateTo.split('-').map(Number);
        const to = new Date(ty, tm - 1, td, 23, 59, 59, 999);
        (where.created_at as any).lte = to;
      }
    }

    return this.storesService.findAll({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      where,
      orderBy: { created_at: 'desc' },
    });
  }

  @Get('return')
  @ApiOperation({ summary: 'Get store returns' })
  @ApiResponse({ status: 200, description: 'List of store returns' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  findReturns(
    @Request() req: any,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('return_status') returnStatus?: string,
  ) {
    const effectiveTake = limit
      ? parseInt(limit, 10)
      : take
        ? parseInt(take, 10)
        : 10;
    const effectiveSkip = page
      ? (parseInt(page, 10) - 1) * effectiveTake
      : skip
        ? parseInt(skip, 10)
        : 0;
    const targetStatus = status || returnStatus || 'Pending';
    const userId = req.user?.userId || req.user?.id;
    return this.storesService.findPendingByTechnician(userId, {
      skip: effectiveSkip,
      take: effectiveTake,
      search,
      status: targetStatus,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get store record by ID' })
  @ApiResponse({ status: 200, description: 'Store record details' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  @ApiResponse({ status: 404, description: 'Store record not found' })
  async findOne(@Param('id') id: string) {
    const store = await this.storesService.findById(id);
    if (!store) {
      throw new NotFoundException('Store record not found');
    }
    return store;
  }

  @Post()
  @ApiOperation({ summary: 'Create new store record' })
  @ApiBody({ type: CreateStoreDto })
  @ApiResponse({
    status: 201,
    description: 'Store record created successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  @LogActivity({
    action: ActivityAction.CREATE,
    entityType: 'stores',
    description: (ctx) => {
      const store = ctx.result;
      const frame = store?.frame_number || ctx.body.frame_number || 'N/A';
      const details = [
        store?.barcode || ctx.body.barcode
          ? `Barcode: ${store?.barcode || ctx.body.barcode}`
          : null,
        store?.material?.name ? `Material: ${store.material.name}` : null,
        store?.customer?.name ? `Customer: ${store.customer.name}` : null,
        store?.warranty_status ? `Warranty: ${store.warranty_status}` : null,
      ]
        .filter(Boolean)
        .join(', ');
      return createDescription(
        'Store Record',
        `Frame ${frame}`,
        details || undefined,
        ctx.user.full_name,
      );
    },
  })
  create(@Body() dto: CreateStoreDto) {
    return this.storesService.create(dto);
  }

  @Put('return/:id/details')
  @ApiOperation({ summary: 'Submit store return details (return/:id/details)' })
  @ApiBody({ type: UpdateStoreReturnDto })
  @ApiResponse({
    status: 200,
    description: 'Store return details completed successfully',
  })
  @LogActivity({
    action: ActivityAction.UPDATE,
    entityType: 'stores',
    entityIdParam: 'id',
    description: (ctx) => {
      const before = ctx.result?.before;
      const after = ctx.result?.after;
      const frame =
        after?.frame_number || before?.frame_number || ctx.params.id;
      const diff =
        before && after ? buildDiffSummary(before, after, ctx.body) : '';
      const who = ctx.user.full_name
        ? `${ctx.user.full_name} completed return`
        : 'Completed return';
      return `${who} for Store Record "Frame ${frame}" — ${diff || 'updated return details'}`;
    },
  })
  async submitReturnDetailsPath1(
    @Param('id') id: string,
    @Body() dto: UpdateStoreReturnDto,
    @Request() req: any,
  ) {
    const userId = req.user?.userId || req.user?.id;
    const isUserAdmin = ['Admin', 'Super Admin'].includes(req.user?.role);
    const result = await this.storesService.submitReturnDetails(
      id,
      userId,
      dto,
      isUserAdmin,
    );
    req.logData = result;
    return result.after;
  }

  @Put('return/:id')
  @ApiOperation({ summary: 'Submit store return details (return/:id)' })
  @ApiBody({ type: UpdateStoreReturnDto })
  @ApiResponse({
    status: 200,
    description: 'Store return details completed successfully',
  })
  async submitReturnDetailsPath2(
    @Param('id') id: string,
    @Body() dto: UpdateStoreReturnDto,
    @Request() req: any,
  ) {
    const userId = req.user?.userId || req.user?.id;
    const isUserAdmin = ['Admin', 'Super Admin'].includes(req.user?.role);
    const result = await this.storesService.submitReturnDetails(
      id,
      userId,
      dto,
      isUserAdmin,
    );
    req.logData = result;
    return result.after;
  }

  @Put(':id/details')
  @ApiOperation({ summary: 'Submit store return details (:id/details)' })
  @ApiBody({ type: UpdateStoreReturnDto })
  @ApiResponse({
    status: 200,
    description: 'Store return details completed successfully',
  })
  async submitReturnDetailsPath3(
    @Param('id') id: string,
    @Body() dto: UpdateStoreReturnDto,
    @Request() req: any,
  ) {
    const userId = req.user?.userId || req.user?.id;
    const isUserAdmin = ['Admin', 'Super Admin'].includes(req.user?.role);
    const result = await this.storesService.submitReturnDetails(
      id,
      userId,
      dto,
      isUserAdmin,
    );
    req.logData = result;
    return result.after;
  }

  @Put(':id/return')
  @ApiOperation({ summary: 'Submit store return details (:id/return)' })
  @ApiBody({ type: UpdateStoreReturnDto })
  @ApiResponse({
    status: 200,
    description: 'Store return details completed successfully',
  })
  async submitReturnDetailsPath4(
    @Param('id') id: string,
    @Body() dto: UpdateStoreReturnDto,
    @Request() req: any,
  ) {
    const userId = req.user?.userId || req.user?.id;
    const isUserAdmin = ['Admin', 'Super Admin'].includes(req.user?.role);
    const result = await this.storesService.submitReturnDetails(
      id,
      userId,
      dto,
      isUserAdmin,
    );
    req.logData = result;
    return result.after;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update existing store record' })
  @ApiBody({ type: UpdateStoreDto })
  @ApiResponse({
    status: 200,
    description: 'Store record updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  @ApiResponse({ status: 404, description: 'Store record not found' })
  @LogActivity({
    action: ActivityAction.UPDATE,
    entityType: 'stores',
    entityIdParam: 'id',
    description: (ctx) => {
      const before = ctx.result?.before;
      const after = ctx.result?.after;
      const frame =
        after?.frame_number || before?.frame_number || ctx.params.id;
      const diff =
        before && after ? buildDiffSummary(before, after, ctx.body) : '';
      const who = ctx.user.full_name
        ? `${ctx.user.full_name} updated`
        : 'Updated';
      return diff
        ? `${who} Store Record "Frame ${frame}" — ${diff}`
        : `${who} Store Record "Frame ${frame}" (no changes detected)`;
    },
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateStoreDto,
    @Request() req: any,
  ) {
    const result = await this.storesService.update(id, dto);
    req.logData = result;
    return result.after;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete store record' })
  @ApiResponse({
    status: 200,
    description: 'Store record soft-deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  @ApiResponse({ status: 404, description: 'Store record not found' })
  @LogActivity({
    action: ActivityAction.DELETE,
    entityType: 'stores',
    entityIdParam: 'id',
    description: (ctx) => {
      const store = ctx.result;
      const frame = store?.frame_number || ctx.params.id;
      return deleteDescription(
        'Store Record',
        `Frame ${frame}`,
        ctx.user.full_name,
      );
    },
  })
  remove(@Param('id') id: string) {
    return this.storesService.remove(id);
  }
}
