import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CustomersService } from './customers.service';
import { Prisma } from '@prisma/client';

@ApiTags('mobile / lookup')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('mobile/customers')
export class MobileCustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @ApiOperation({
    summary: '[Mobile] List customers for picker dropdown',
    description:
      'Returns a paginated list of active customers. ' +
      'Use this to populate the customer selector before picking a mill.',
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
    description: 'Search by customer name',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: 'Filter by status (default ACTIVE)',
  })
  @ApiResponse({ status: 200, description: 'Paginated list of customers' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    const where: Prisma.CustomerWhereInput = {};

    if (search) {
      const orConditions: Prisma.CustomerWhereInput[] = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { mills: { some: { name: { contains: search, mode: 'insensitive' } } } },
      ];

      const cleanedPhone = search.replace(/[^\d+]/g, '');
      if (cleanedPhone && cleanedPhone !== '+' && cleanedPhone.length >= 5) {
        orConditions.push({
          phone: { contains: cleanedPhone, mode: 'insensitive' },
        });
      }

      where.OR = orConditions;
    }

    where.status = status || 'ACTIVE';

    return this.customersService.findAll({
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 100,
      where,
      orderBy: { name: 'asc' },
    });
  }
}
