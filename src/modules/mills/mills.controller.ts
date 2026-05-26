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
        { email: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];

      // Smart phone number normalization: strip spaces and formatting characters (non-digits and non-plus)
      const cleanedPhoneSearch = search.replace(/[^\d+]/g, '');
      if (cleanedPhoneSearch && cleanedPhoneSearch !== '+') {
        orConditions.push({
          phone: { contains: cleanedPhoneSearch, mode: 'insensitive' },
        });
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
  create(@Body() dto: CreateMillDto) {
    return this.millsService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update existing mill' })
  update(@Param('id') id: string, @Body() dto: UpdateMillDto) {
    return this.millsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete mill' })
  remove(@Param('id') id: string) {
    return this.millsService.remove(id);
  }
}
