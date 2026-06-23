import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TechniciansService } from './technicians.service';
import { Prisma } from '@prisma/client';

@ApiTags('mobile / lookup')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('mobile/technicians')
export class MobileTechniciansController {
  constructor(private readonly techniciansService: TechniciansService) {}

  @Get()
  @ApiOperation({
    summary: '[Mobile] List technicians for selection',
    description:
      'Returns a paginated list of active technicians/engineers. ' +
      'Use this to select co-technicians when creating service or installation reports.',
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
    description: 'Search by technician name, email or phone',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description:
      'Filter by availability status (e.g. AVAILABLE, BUSY, INACTIVE)',
  })
  @ApiResponse({ status: 200, description: 'Paginated list of technicians' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
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
      if (cleanedPhone && cleanedPhone !== '+' && cleanedPhone.length >= 5) {
        orConditions.push({
          phone: { contains: cleanedPhone, mode: 'insensitive' },
        });
      }

      where.OR = orConditions;
    }

    if (status) {
      where.status = status;
    } else {
      // By default on mobile, filter out INACTIVE/stale technicians
      where.status = { not: 'INACTIVE' };
    }

    return this.techniciansService.findAll({
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 100,
      where,
      orderBy: { full_name: 'asc' },
    });
  }
}
