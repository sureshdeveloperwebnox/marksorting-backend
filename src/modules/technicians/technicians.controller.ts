import { Controller, Get, Param, Query, Put, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TechniciansService } from './technicians.service';
import { Prisma } from '@prisma/client';

@ApiTags('technicians')
@Controller('technicians')
export class TechniciansController {
  constructor(private readonly techniciansService: TechniciansService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all technicians with pagination and filtering',
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
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.techniciansService.updateStatus(id, status);
  }
}
