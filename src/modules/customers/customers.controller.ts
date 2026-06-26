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
import { CustomersService } from './customers.service';
import { Prisma } from '@prisma/client';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { LogActivity } from '../activity-logs/decorators/log-activity.decorator';
import { ActivityAction } from '../activity-logs/enums/activity-action.enum';
import {
  createDescription,
  updateDescription,
  deleteDescription,
  buildDiffSummary,
} from '../activity-logs/helpers/description.helper';

@ApiTags('customers')
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all customers with pagination and filtering' })
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
    const where: Prisma.CustomerWhereInput = {};

    if (search) {
      const orConditions: Prisma.CustomerWhereInput[] = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        {
          mills: { some: { name: { contains: search, mode: 'insensitive' } } },
        },
      ];

      const cleanedPhone = search.replace(/[^\d+]/g, '');
      if (cleanedPhone && cleanedPhone !== '+' && cleanedPhone.length >= 5) {
        orConditions.push({
          phone: { contains: cleanedPhone, mode: 'insensitive' },
        });
      }

      where.OR = orConditions;
    }

    if (status) where.status = status;

    return this.customersService.findAll({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      where,
      orderBy: { created_at: 'desc' },
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer by ID' })
  findOne(@Param('id') id: string) {
    return this.customersService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new customer' })
  @LogActivity({
    action: ActivityAction.CREATE,
    entityType: 'customers',
    description: (ctx) => {
      const customer = ctx.result;
      const name = customer?.name || ctx.body.name || 'Unknown';
      const details = [
        customer?.email ? `Email: ${customer.email}` : null,
        customer?.phone ? `Phone: ${customer.phone}` : null,
        customer?.status ? `Status: ${customer.status}` : null,
      ]
        .filter(Boolean)
        .join(', ');
      return createDescription(
        'Customer',
        name,
        details || undefined,
        ctx.user.full_name,
      );
    },
  })
  create(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update existing customer' })
  @LogActivity({
    action: ActivityAction.UPDATE,
    entityType: 'customers',
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
        ? `${who} Customer "${name}" — ${diff}`
        : `${who} Customer "${name}" (no changes detected)`;
    },
  })
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customersService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete customer' })
  @LogActivity({
    action: ActivityAction.DELETE,
    entityType: 'customers',
    entityIdParam: 'id',
    description: (ctx) => {
      const customer = ctx.result;
      const name = customer?.name || ctx.params.id;
      return deleteDescription('Customer', name, ctx.user.full_name);
    },
  })
  remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }
}
