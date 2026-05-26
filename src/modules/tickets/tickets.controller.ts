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
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

@ApiTags('tickets')
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all support tickets with pagination and filtering',
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
    description: 'Search query term',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: 'Filter by ticket status',
  })
  @ApiQuery({
    name: 'priority',
    required: false,
    type: String,
    description: 'Filter by ticket priority',
  })
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
  ) {
    return this.ticketsService.findAll({
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 10,
      search,
      status,
      priority,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get support ticket by ID' })
  findOne(@Param('id') id: string) {
    return this.ticketsService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new support ticket' })
  create(@Body() dto: CreateTicketDto) {
    return this.ticketsService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update existing support ticket' })
  update(@Param('id') id: string, @Body() dto: UpdateTicketDto) {
    return this.ticketsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete support ticket' })
  remove(@Param('id') id: string) {
    return this.ticketsService.remove(id);
  }
}
