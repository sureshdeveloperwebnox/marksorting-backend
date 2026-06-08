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
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { StoresService } from './stores.service';
import { Prisma } from '@prisma/client';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { LogActivity } from '../activity-logs/decorators/log-activity.decorator';
import { ActivityAction } from '../activity-logs/enums/activity-action.enum';
import {
  createDescription,
  updateDescription,
  deleteDescription,
  buildDiffSummary,
} from '../activity-logs/helpers/description.helper';

@ApiTags('stores')
@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all store records with pagination and filtering',
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
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('service_engineer_id') serviceEngineerId?: string,
    @Query('customer_id') customerId?: string,
    @Query('material_id') materialId?: string,
    @Query('warranty_status') warrantyStatus?: string,
    @Query('return_status') returnStatus?: string,
    @Query('inflow_status') inflowStatus?: string,
  ) {
    const where: Prisma.StoreWhereInput = {};

    if (search) {
      where.OR = [
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

    if (serviceEngineerId) {
      where.service_engineer_id = serviceEngineerId;
    }

    if (customerId) {
      where.customer_id = customerId;
    }

    if (warrantyStatus) {
      where.warranty_status = warrantyStatus;
    }

    if (returnStatus) {
      where.return_status = returnStatus;
    }

    if (inflowStatus) {
      where.inflow_status = inflowStatus;
    }

    if (materialId) {
      where.materials = {
        some: {
          material_id: materialId,
        },
      };
    }

    return this.storesService.findAll({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      where,
      orderBy: { created_at: 'desc' },
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get store record by ID' })
  findOne(@Param('id') id: string) {
    return this.storesService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new store record' })
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

  @Put(':id')
  @ApiOperation({ summary: 'Update existing store record' })
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
  update(@Param('id') id: string, @Body() dto: UpdateStoreDto) {
    return this.storesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete store record' })
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
