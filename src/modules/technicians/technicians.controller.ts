import { Controller, Get, Param, Query, Put, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { TechniciansService } from './technicians.service';
import { Prisma } from '@prisma/client';
import { LogActivity } from '../activity-logs/decorators/log-activity.decorator';
import { ActivityAction } from '../activity-logs/enums/activity-action.enum';
import { updateDescription } from '../activity-logs/helpers/description.helper';

@ApiTags('technicians')
@Controller('technicians')
export class TechniciansController {
  constructor(private readonly techniciansService: TechniciansService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all technicians with pagination and filtering',
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
    const where: Prisma.TechnicianWhereInput = {};

    if (search) {
      const orConditions: Prisma.TechnicianWhereInput[] = [
        { full_name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];

      const cleanedPhone = search.replace(/[^\d+]/g, '');
      if (cleanedPhone && cleanedPhone !== '+') {
        orConditions.push({
          phone: { contains: cleanedPhone, mode: 'insensitive' },
        });
      }

      where.OR = orConditions;
    }

    if (status) {
      where.status = status;
    }

    return this.techniciansService.findAll({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      where,
      orderBy: { full_name: 'asc' },
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get technician by ID' })
  findOne(@Param('id') id: string) {
    return this.techniciansService.findById(id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update technician availability status' })
  @LogActivity({
    action: ActivityAction.UPDATE,
    entityType: 'technicians',
    entityIdParam: 'id',
    description: (ctx) => {
      const technician = ctx.result;
      const name = technician?.full_name || ctx.params.id;
      const email = technician?.email ? ` (${technician.email})` : '';
      return updateDescription(
        'Technician',
        `${name}${email}`,
        ctx.body,
        ctx.user.full_name,
      );
    },
  })
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.techniciansService.updateStatus(id, status);
  }
}
