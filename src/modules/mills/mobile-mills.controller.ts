import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MillsService } from './mills.service';
import { Prisma } from '@prisma/client';

@ApiTags('mobile / lookup')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('mobile/mills')
export class MobileMillsController {
  constructor(private readonly millsService: MillsService) {}

  // ── List mills (optionally filtered by customer_id) ────────────────────────

  @Get()
  @ApiOperation({
    summary: '[Mobile] List mills with optional customer_id filter',
    description:
      'Pass ?customer_id=<uuid> to restrict results to mills belonging to a specific customer. ' +
      'Use this to populate the mill picker dropdown after the engineer selects a customer.',
  })
  @ApiQuery({
    name: 'customer_id',
    required: false,
    type: String,
    description: 'Filter by customer UUID',
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
    description: 'Search by mill name, email, phone, or address',
  })
  @ApiResponse({ status: 200, description: 'Paginated list of mills' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  findAll(
    @Query('customer_id') customerId?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
  ) {
    const where: Prisma.MillWhereInput = {};

    if (customerId) {
      where.customer_id = customerId;
    }

    if (search) {
      const orConditions: Prisma.MillWhereInput[] = [
        { name: { contains: search, mode: 'insensitive' } },
        { ref_no: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { place: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
      const cleanedPhone = search.replace(/[^\d+]/g, '');
      if (cleanedPhone && cleanedPhone !== '+' && cleanedPhone.length >= 5) {
        orConditions.push(
          { phone: { contains: cleanedPhone, mode: 'insensitive' } },
          { phone_2: { contains: cleanedPhone, mode: 'insensitive' } },
          { phone_3: { contains: cleanedPhone, mode: 'insensitive' } },
        );
      }
      where.OR = orConditions;
    }

    return this.millsService.findAll({
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 100,
      where,
      orderBy: { name: 'asc' },
    });
  }

  // ── Get mills for a specific customer (nested route) ──────────────────────

  @Get('by-customer/:customerId')
  @ApiOperation({
    summary: '[Mobile] List mills belonging to a specific customer',
    description:
      'Convenience nested route. Returns all active mills for the given customer UUID. ' +
      'Sorted alphabetically by name.',
  })
  @ApiParam({ name: 'customerId', description: 'Customer UUID', type: String })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: "Search within the customer's mills",
  })
  @ApiResponse({ status: 200, description: 'List of mills for the customer' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  findByCustomer(
    @Param('customerId') customerId: string,
    @Query('search') search?: string,
  ) {
    const where: Prisma.MillWhereInput = { customer_id: customerId };

    if (search) {
      const orConditions: Prisma.MillWhereInput[] = [
        { name: { contains: search, mode: 'insensitive' } },
        { ref_no: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { place: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
      const cleanedPhone = search.replace(/[^\d+]/g, '');
      if (cleanedPhone && cleanedPhone !== '+' && cleanedPhone.length >= 5) {
        orConditions.push(
          { phone: { contains: cleanedPhone, mode: 'insensitive' } },
          { phone_2: { contains: cleanedPhone, mode: 'insensitive' } },
          { phone_3: { contains: cleanedPhone, mode: 'insensitive' } },
        );
      }
      where.OR = orConditions;
    }

    return this.millsService.findAll({
      skip: 0,
      take: 200,
      where,
      orderBy: { name: 'asc' },
    });
  }

  // ── Get single mill by ID ─────────────────────────────────────────────────

  @Get(':id')
  @ApiOperation({ summary: '[Mobile] Get mill details by ID' })
  @ApiParam({ name: 'id', description: 'Mill UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Mill details including customer info',
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  @ApiResponse({ status: 404, description: 'Mill not found' })
  findOne(@Param('id') id: string) {
    return this.millsService.findById(id);
  }
}
