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
import { MaterialsService } from './materials.service';
import { Prisma } from '@prisma/client';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { LogActivity } from '../activity-logs/decorators/log-activity.decorator';
import { ActivityAction } from '../activity-logs/enums/activity-action.enum';
import {
  createDescription,
  updateDescription,
  deleteDescription,
  buildDiffSummary,
} from '../activity-logs/helpers/description.helper';

@ApiTags('materials')
@Controller('materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all materials with pagination and filtering' })
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
    description: 'Search query',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: 'Filter by status',
  })
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    const where: Prisma.MaterialWhereInput = {};

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    if (status) {
      where.status = status;
    }

    return this.materialsService.findAll({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      where,
      orderBy: { name: 'asc' },
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get material by ID' })
  findOne(@Param('id') id: string) {
    return this.materialsService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new material' })
  @LogActivity({
    action: ActivityAction.CREATE,
    entityType: 'materials',
    description: (ctx) => {
      const material = ctx.result;
      const name = material?.name || ctx.body.name || 'Unknown';
      const details = [
        material?.unit || ctx.body.unit
          ? `Unit: ${material?.unit || ctx.body.unit}`
          : null,
        material?.status ? `Status: ${material.status}` : null,
      ]
        .filter(Boolean)
        .join(', ');
      return createDescription(
        'Material',
        name,
        details || undefined,
        ctx.user.full_name,
      );
    },
  })
  create(@Body() dto: CreateMaterialDto) {
    return this.materialsService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update existing material' })
  @LogActivity({
    action: ActivityAction.UPDATE,
    entityType: 'materials',
    entityIdParam: 'id',
    description: (ctx) => {
      const before = ctx.result?.before;
      const after = ctx.result?.after;
      const name = after?.name || before?.name || ctx.params.id;
      const diff =
        before && after ? buildDiffSummary(before, after, ctx.body) : '';
      const who = ctx.user.full_name
        ? `${ctx.user.full_name} updated`
        : 'Updated';
      return diff
        ? `${who} Material "${name}" — ${diff}`
        : `${who} Material "${name}" (no changes detected)`;
    },
  })
  update(@Param('id') id: string, @Body() dto: UpdateMaterialDto) {
    return this.materialsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete material' })
  @LogActivity({
    action: ActivityAction.DELETE,
    entityType: 'materials',
    entityIdParam: 'id',
    description: (ctx) => {
      const material = ctx.result;
      const name = material?.name || ctx.params.id;
      return deleteDescription('Material', name, ctx.user.full_name);
    },
  })
  remove(@Param('id') id: string) {
    return this.materialsService.remove(id);
  }
}
