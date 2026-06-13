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
import { MillsService } from './mills.service';
import { Prisma } from '@prisma/client';
import { CreateMillDto } from './dto/create-mill.dto';
import { UpdateMillDto } from './dto/update-mill.dto';
import { LogActivity } from '../activity-logs/decorators/log-activity.decorator';
import { ActivityAction } from '../activity-logs/enums/activity-action.enum';
import {
  createDescription,
  updateDescription,
  deleteDescription,
  buildDiffSummary,
} from '../activity-logs/helpers/description.helper';

@ApiTags('mills')
@Controller('mills')
export class MillsController {
  constructor(private readonly millsService: MillsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all mills with pagination and filtering' })
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
  @ApiQuery({
    name: 'customer_id',
    required: false,
    type: String,
    description: 'Filter by customer UUID',
  })
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('customer_id') customerId?: string,
  ) {
    const where: Prisma.MillWhereInput = {};

    if (search) {
      const orConditions: Prisma.MillWhereInput[] = [
        { name: { contains: search, mode: 'insensitive' } },
        { ref_no: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { place: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];

      // Smart phone number normalization: strip spaces and formatting characters (non-digits and non-plus)
      const cleanedPhoneSearch = search.replace(/[^\d+]/g, '');
      if (cleanedPhoneSearch && cleanedPhoneSearch !== '+') {
        orConditions.push(
          { phone: { contains: cleanedPhoneSearch, mode: 'insensitive' } },
          { phone_2: { contains: cleanedPhoneSearch, mode: 'insensitive' } },
          { phone_3: { contains: cleanedPhoneSearch, mode: 'insensitive' } },
        );
      }

      where.OR = orConditions;
    }

    if (status) {
      where.status = status;
    }

    if (customerId) {
      where.customer_id = customerId;
    }

    return this.millsService.findAll({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      where,
      orderBy: { created_at: 'desc' },
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get mill by ID' })
  findOne(@Param('id') id: string) {
    return this.millsService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new mill' })
  @LogActivity({
    action: ActivityAction.CREATE,
    entityType: 'mills',
    description: (ctx) => {
      const mill = ctx.result;
      const name = mill?.name || ctx.body.name || 'Unknown';
      const details = [
        mill?.customer?.name ? `Customer: ${mill.customer.name}` : null,
        mill?.email ? `Email: ${mill.email}` : null,
        mill?.phone ? `Phone: ${mill.phone}` : null,
        mill?.phone_2 ? `Phone 2: ${mill.phone_2}` : null,
        mill?.phone_3 ? `Phone 3: ${mill.phone_3}` : null,
        mill?.status ? `Status: ${mill.status}` : null,
      ]
        .filter(Boolean)
        .join(', ');
      return createDescription(
        'Mill',
        name,
        details || undefined,
        ctx.user.full_name,
      );
    },
  })
  create(@Body() dto: CreateMillDto) {
    return this.millsService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update existing mill' })
  @LogActivity({
    action: ActivityAction.UPDATE,
    entityType: 'mills',
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
        ? `${who} Mill "${name}" — ${diff}`
        : `${who} Mill "${name}" (no changes detected)`;
    },
  })
  update(@Param('id') id: string, @Body() dto: UpdateMillDto) {
    console.log(`[MillsController] UPDATE called: id=${id}, name=${dto.name}`);
    return this.millsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete mill' })
  @LogActivity({
    action: ActivityAction.DELETE,
    entityType: 'mills',
    entityIdParam: 'id',
    description: (ctx) => {
      const mill = ctx.result;
      const name = mill?.name || ctx.params.id;
      return deleteDescription('Mill', name, ctx.user.full_name);
    },
  })
  remove(@Param('id') id: string) {
    return this.millsService.remove(id);
  }
}
