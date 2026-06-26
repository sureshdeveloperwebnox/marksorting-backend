import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MaterialsService } from './materials.service';
import { Prisma } from '@prisma/client';
import { CreateMaterialDto } from './dto/create-material.dto';
import { LogActivity } from '../activity-logs/decorators/log-activity.decorator';
import { ActivityAction } from '../activity-logs/enums/activity-action.enum';
import { createDescription } from '../activity-logs/helpers/description.helper';

@ApiTags('mobile / lookup')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('mobile/materials')
export class MobileMaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Get()
  @ApiOperation({
    summary: '[Mobile] List active materials for picker dropdown',
    description:
      'Returns a paginated list of active materials. ' +
      'Use this to populate the materials selector when adding store records.',
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
    description: 'Page size (default 100)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by material name',
  })
  @ApiResponse({ status: 200, description: 'Paginated list of materials' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
  ) {
    const where: Prisma.MaterialWhereInput = {};

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    where.status = 'ACTIVE';

    return this.materialsService.findAll({
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 100,
      where,
      orderBy: { name: 'asc' },
    });
  }

  @Post()
  @ApiOperation({
    summary: '[Mobile] Create a new material on the fly',
    description:
      'Creates a new material for the store record material selector.',
  })
  @ApiBody({ type: CreateMaterialDto })
  @ApiResponse({ status: 201, description: 'Material created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
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
}
