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
import { LogActivity } from '../activity-logs/decorators/log-activity.decorator';
import { ActivityAction } from '../activity-logs/enums/activity-action.enum';
import { createDescription, updateDescription, deleteDescription, buildDiffSummary } from '../activity-logs/helpers/description.helper';

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
  @LogActivity({
    action: ActivityAction.CREATE,
    entityType: 'tickets',
    description: (ctx) => {
      const ticket = ctx.result;
      const title = ticket?.title || ticket?.subject || ctx.body.title || ctx.body.subject || 'Unknown';
      const details = [
        ticket?.priority || ctx.body.priority ? `Priority: ${ticket?.priority || ctx.body.priority}` : null,
        ticket?.status ? `Status: ${ticket.status}` : null,
      ].filter(Boolean).join(', ');
      return createDescription('Support Ticket', title, details || undefined, ctx.user.full_name);
    },
  })
  create(@Body() dto: CreateTicketDto) {
    return this.ticketsService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update existing support ticket' })
  @LogActivity({
    action: ActivityAction.UPDATE,
    entityType: 'tickets',
    entityIdParam: 'id',
    description: (ctx) => {
      const before = ctx.result?.before;
      const after = ctx.result?.after;
      const title = after?.title || after?.subject || before?.title || before?.subject || ctx.params.id;
      const diff = before && after ? buildDiffSummary(before, after, ctx.body) : '';
      const who = ctx.user.full_name ? `${ctx.user.full_name} updated` : 'Updated';
      return diff
        ? `${who} Support Ticket "${title}" — ${diff}`
        : `${who} Support Ticket "${title}" (no changes detected)`;
    },
  })
  update(@Param('id') id: string, @Body() dto: UpdateTicketDto) {
    return this.ticketsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete support ticket' })
  @LogActivity({
    action: ActivityAction.DELETE,
    entityType: 'tickets',
    entityIdParam: 'id',
    description: (ctx) => {
      const ticket = ctx.result;
      const title = ticket?.title || ticket?.subject || ctx.params.id;
      return deleteDescription('Support Ticket', title, ctx.user.full_name);
    },
  })
  remove(@Param('id') id: string) {
    return this.ticketsService.remove(id);
  }
}
