import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StoresService } from './stores.service';
import { UpdateStoreReturnDto } from './dto/update-store-return.dto';
import { MobileCreateStoreDto } from './dto/mobile-create-store.dto';
import { MobileUpdateStoreDto } from './dto/mobile-update-store.dto';
import { LogActivity } from '../activity-logs/decorators/log-activity.decorator';
import { ActivityAction } from '../activity-logs/enums/activity-action.enum';
import {
  createDescription,
  updateDescription,
  deleteDescription,
  buildDiffSummary,
} from '../activity-logs/helpers/description.helper';

@ApiTags('mobile / store-returns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('mobile/store-returns')
export class MobileStoreReturnsController {
  constructor(private readonly storesService: StoresService) {}

  @Get()
  @ApiOperation({
    summary: '[Mobile] List pending store returns for the logged-in engineer',
    description:
      'Returns a list of store records with "Pending" return status assigned to the logged-in technician.',
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
    description: 'Search by frame number, barcode or customer name',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of pending store returns',
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  findAll(
    @Request() req: any,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
  ) {
    return this.storesService.findPendingByTechnician(req.user.userId, {
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 10,
      search,
    });
  }

  @Put(':id')
  @ApiOperation({
    summary: '[Mobile] Submit store return details',
    description:
      'Submits courier/provider name and invoice/receipt number to complete a store return. The status transitions to completed.',
  })
  @ApiBody({ type: UpdateStoreReturnDto })
  @ApiResponse({
    status: 200,
    description: 'Store return completed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or status is not Pending',
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  @ApiResponse({
    status: 403,
    description: "Forbidden from updating another engineer's store record",
  })
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
        ? `${ctx.user.full_name} completed return`
        : 'Completed return';
      return `${who} for Store Record "Frame ${frame}" — ${diff || 'updated return details'}`;
    },
  })
  submitReturn(
    @Param('id') id: string,
    @Body() dto: UpdateStoreReturnDto,
    @Request() req: any,
  ) {
    return this.storesService.submitReturnDetails(id, req.user.userId, dto);
  }
}

@ApiTags('mobile / stores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('mobile/stores')
export class MobileStoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get()
  @ApiOperation({
    summary: '[Mobile] List store records assigned to the logged-in engineer',
    description:
      'Returns a paginated list of store records assigned to the logged-in technician/service engineer, with optional search and status filters.',
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
    description: 'Search by frame number, barcode or customer name',
  })
  @ApiQuery({
    name: 'return_status',
    required: false,
    type: String,
    description: 'Filter by return status (Pending, Returned, Not Returned)',
  })
  @ApiQuery({
    name: 'inflow_status',
    required: false,
    type: String,
    description:
      'Filter by inflow status (Inflow, Outflow, Available, Damaged)',
  })
  @ApiQuery({
    name: 'warranty_status',
    required: false,
    type: String,
    description: 'Filter by warranty status (Non Warranty, Supplementary, AMC With Spare, AMC Without Spare)',
  })
  @ApiResponse({ status: 200, description: 'Paginated list of store records' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  findAll(
    @Request() req: any,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('return_status') return_status?: string,
    @Query('returnStatus') returnStatus?: string,
    @Query('inflow_status') inflow_status?: string,
    @Query('inflowStatus') inflowStatus?: string,
    @Query('warranty_status') warranty_status?: string,
    @Query('warrantyStatus') warrantyStatus?: string,
  ) {
    return this.storesService.findByTechnician(req.user.userId, {
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 10,
      search,
      return_status: return_status || returnStatus,
      inflow_status: inflow_status || inflowStatus,
      warranty_status: warranty_status || warrantyStatus,
    });
  }

  @Put(':id')
  @ApiOperation({
    summary: '[Mobile] Submit store return details',
    description:
      'Submits courier/provider name and invoice/receipt number to complete a store return.',
  })
  @ApiBody({ type: UpdateStoreReturnDto })
  @ApiResponse({
    status: 200,
    description: 'Store return completed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or status is not Pending',
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  @ApiResponse({
    status: 403,
    description: "Forbidden from updating another engineer's store record",
  })
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
        ? `${ctx.user.full_name} completed return`
        : 'Completed return';
      return `${who} for Store Record "Frame ${frame}" — ${diff || 'updated return details'}`;
    },
  })
  submitReturn(
    @Param('id') id: string,
    @Body() dto: UpdateStoreReturnDto,
    @Request() req: any,
  ) {
    return this.storesService.submitReturnDetails(id, req.user.userId, dto);
  }

  @Put(':id/return')
  @ApiOperation({
    summary: '[Mobile] Submit store return details (nested route)',
    description:
      'Submits courier/provider name and invoice/receipt number to complete a store return.',
  })
  @ApiBody({ type: UpdateStoreReturnDto })
  @ApiResponse({
    status: 200,
    description: 'Store return completed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or status is not Pending',
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  @ApiResponse({
    status: 403,
    description: "Forbidden from updating another engineer's store record",
  })
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
        ? `${ctx.user.full_name} completed return`
        : 'Completed return';
      return `${who} for Store Record "Frame ${frame}" — ${diff || 'updated return details'}`;
    },
  })
  submitReturnAlias(
    @Param('id') id: string,
    @Body() dto: UpdateStoreReturnDto,
    @Request() req: any,
  ) {
    return this.storesService.submitReturnDetails(id, req.user.userId, dto);
  }

  @Post()
  @ApiOperation({
    summary: '[Mobile] Create a new store record for the logged-in engineer',
    description: 'Registers a new store record under the logged-in technician.',
  })
  @ApiBody({ type: MobileCreateStoreDto })
  @ApiResponse({ status: 201, description: 'Store record created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  @LogActivity({
    action: ActivityAction.CREATE,
    entityType: 'stores',
    description: (ctx) => {
      const store = ctx.result;
      const frame = store?.frame_number || ctx.body.frame_number || 'N/A';
      const details = [
        store?.barcode || ctx.body.barcode ? `Barcode: ${store?.barcode || ctx.body.barcode}` : null,
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
  create(@Body() dto: MobileCreateStoreDto, @Request() req: any) {
    return this.storesService.create({
      ...dto,
      service_engineer_id: req.user.userId,
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: '[Mobile] Get store record by ID',
    description: 'Retrieves the details of a single store record if it belongs to the logged-in technician.',
  })
  @ApiResponse({ status: 200, description: 'Store record found' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden from accessing other engineers records' })
  @ApiResponse({ status: 404, description: 'Store record not found' })
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.storesService.findByIdAndTechnician(id, req.user.userId);
  }

  @Put(':id')
  @ApiOperation({
    summary: '[Mobile] Update store record by ID',
    description: 'Updates a store record if it belongs to the logged-in technician.',
  })
  @ApiBody({ type: MobileUpdateStoreDto })
  @ApiResponse({ status: 200, description: 'Store record updated successfully' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden from updating other engineers records' })
  @ApiResponse({ status: 404, description: 'Store record not found' })
  @LogActivity({
    action: ActivityAction.UPDATE,
    entityType: 'stores',
    entityIdParam: 'id',
    description: (ctx) => {
      const before = ctx.result?.before;
      const after = ctx.result?.after;
      const frame = after?.frame_number || before?.frame_number || ctx.params.id;
      const diff = before && after ? buildDiffSummary(before, after, ctx.body) : '';
      const who = ctx.user.full_name ? `${ctx.user.full_name} updated` : 'Updated';
      return diff
        ? `${who} Store Record "Frame ${frame}" — ${diff}`
        : `${who} Store Record "Frame ${frame}" (no changes detected)`;
    },
  })
  update(
    @Param('id') id: string,
    @Body() dto: MobileUpdateStoreDto,
    @Request() req: any,
  ) {
    return this.storesService.updateByTechnician(id, req.user.userId, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: '[Mobile] Delete store record by ID',
    description: 'Soft deletes a store record if it belongs to the logged-in technician.',
  })
  @ApiResponse({ status: 200, description: 'Store record deleted successfully' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden from deleting other engineers records' })
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
  remove(@Param('id') id: string, @Request() req: any) {
    return this.storesService.removeByTechnician(id, req.user.userId);
  }
}
