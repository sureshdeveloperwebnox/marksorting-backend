import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { CreateMobileTicketDto } from './dto/create-mobile-ticket.dto';
import { UpdateMobileTicketDto } from './dto/update-mobile-ticket.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// ── Reusable inline schema fragments for Swagger ─────────────────────────────

const ticketSchema = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      format: 'uuid',
      example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    },
    ticket_number: { type: 'string', example: 'TKT-20260601-ABCDEF' },
    user_id: { type: 'string', format: 'uuid', nullable: true, example: null },
    service_engineer_id: {
      type: 'string',
      format: 'uuid',
      nullable: true,
      example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    },
    customer_id: {
      type: 'string',
      format: 'uuid',
      nullable: true,
      example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    },
    mill_id: {
      type: 'string',
      format: 'uuid',
      nullable: true,
      example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    },
    subject: { type: 'string', example: 'Printer issue' },
    description: {
      type: 'string',
      example: 'Sorting machine printer is offline.',
    },
    status: {
      type: 'string',
      enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED'],
      example: 'OPEN',
    },
    priority: {
      type: 'string',
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      example: 'MEDIUM',
    },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' },
    service_engineer: {
      type: 'object',
      nullable: true,
      properties: {
        id: { type: 'string', format: 'uuid' },
        full_name: { type: 'string', example: 'Ravi Kumar' },
        email: { type: 'string', example: 'engineer@marksorting.com' },
        phone: { type: 'string', example: '+919876543210' },
        status: { type: 'string', example: 'AVAILABLE' },
      },
    },
    customer: {
      type: 'object',
      nullable: true,
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string', example: 'ABC Mill Group' },
        email: { type: 'string', example: 'customer@example.com' },
        phone: { type: 'string', example: '+919988776655' },
      },
    },
    mill: {
      type: 'object',
      nullable: true,
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string', example: 'ABC Rice Mill' },
      },
    },
  },
};

const paginatedTicketsSchema = {
  type: 'object',
  properties: {
    tickets: { type: 'array', items: ticketSchema },
    total: { type: 'integer', example: 1 },
  },
};

const errorSchema = (message: string) => ({
  type: 'object',
  properties: {
    statusCode: { type: 'integer' },
    message: { type: 'string', example: message },
  },
});

// ── Controller ───────────────────────────────────────────────────────────────

@ApiTags('mobile / tickets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('mobile/tickets')
export class MobileTicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  @ApiOperation({
    summary: '[Mobile] List support tickets for the logged-in engineer',
    description:
      '**Role-based filtering:**\n' +
      '- **Service Engineer** – only tickets they are assigned to as `service_engineer_id` are returned.\n' +
      '- **Other roles** (Admin, Manager…) – all tickets are returned.\n\n' +
      'Results are paginated and ordered by `created_at DESC`.',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    type: Number,
    description: 'Offset — number of records to skip (default `0`)',
  })
  @ApiQuery({
    name: 'take',
    required: false,
    type: Number,
    description: 'Page size — number of records to return (default `10`)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description:
      'Full-text search across ticket number, subject, description, customer name, and mill name',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED'],
    description: 'Filter by ticket status',
  })
  @ApiQuery({
    name: 'priority',
    required: false,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    description: 'Filter by ticket priority',
  })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    type: String,
    description: 'Filter from creation date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    type: String,
    description: 'Filter to creation date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Alias/fallback for dateFrom (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'Alias/fallback for dateTo (YYYY-MM-DD)',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of support tickets',
    schema: paginatedTicketsSchema,
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid JWT bearer token',
    schema: errorSchema('Unauthorized'),
  })
  findAll(
    @Request() req: any,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.ticketsService.findAll(
      {
        skip: skip ? parseInt(skip, 10) : 0,
        take: take ? parseInt(take, 10) : 10,
        search,
        status,
        priority,
        dateFrom: dateFrom || startDate,
        dateTo: dateTo || endDate,
      },
      req.user,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: '[Mobile] Get a single support ticket by ID',
    description:
      'Returns full support ticket details including assigned service engineer, customer, and mill.\n\n' +
      'Service Engineers receive **403** if they are not assigned to the ticket.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Ticket UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Support ticket details',
    schema: ticketSchema,
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid JWT bearer token',
    schema: errorSchema('Unauthorized'),
  })
  @ApiResponse({
    status: 403,
    description: 'Not assigned to this ticket',
    schema: errorSchema('You do not have permission to access this ticket'),
  })
  @ApiResponse({
    status: 404,
    description: 'Ticket not found',
    schema: errorSchema('Support ticket with ID "..." not found'),
  })
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.ticketsService.findById(id, req.user);
  }

  @Post()
  @ApiOperation({
    summary: '[Mobile] Create a new support ticket',
    description:
      'Creates a new support ticket and returns it.\n\n' +
      '**Auto-assignment rule:** When a `Service Engineer` submits this request, their ID is automatically ' +
      'assigned as the `service_engineer_id` even if omitted from the payload.\n\n' +
      '**Validation:** Referenced technician, customer, and mill IDs are validated to exist. ' +
      'Also validates that the selected mill belongs to the selected customer.',
  })
  @ApiBody({ type: CreateMobileTicketDto })
  @ApiResponse({
    status: 201,
    description: 'Support ticket created successfully',
    schema: ticketSchema,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or relation validation failed',
    schema: errorSchema('Service engineer not found'),
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid JWT bearer token',
    schema: errorSchema('Unauthorized'),
  })
  create(@Body() dto: CreateMobileTicketDto, @Request() req: any) {
    return this.ticketsService.create(dto, req.user);
  }

  @Put(':id')
  @ApiOperation({
    summary: '[Mobile] Update an existing support ticket',
    description:
      'Performs a **partial update** — only fields present in the request body are changed.\n\n' +
      'Service Engineers receive **403** if they are not assigned to the ticket. ' +
      'They cannot reassign the ticket to another engineer (assignment is forced to their own ID).',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Ticket UUID to update',
  })
  @ApiBody({ type: UpdateMobileTicketDto })
  @ApiResponse({
    status: 200,
    description: 'Support ticket updated successfully',
    schema: {
      type: 'object',
      properties: { before: ticketSchema, after: ticketSchema },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or relation validation failed',
    schema: errorSchema(
      'Selected mill does not belong to the selected customer',
    ),
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid JWT bearer token',
    schema: errorSchema('Unauthorized'),
  })
  @ApiResponse({
    status: 403,
    description: 'Not assigned to this ticket',
    schema: errorSchema('You do not have permission to access this ticket'),
  })
  @ApiResponse({
    status: 404,
    description: 'Ticket not found',
    schema: errorSchema('Support ticket with ID "..." not found'),
  })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMobileTicketDto,
    @Request() req: any,
  ) {
    return this.ticketsService.update(id, dto, req.user);
  }

  @Delete(':id')
  @ApiOperation({
    summary: '[Mobile] Delete a support ticket',
    description:
      'Deletes a support ticket record.\n\n' +
      'Service Engineers receive **403** if they are not assigned to the ticket.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Ticket UUID to delete',
  })
  @ApiResponse({
    status: 200,
    description: 'Support ticket deleted successfully',
    schema: ticketSchema,
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid JWT bearer token',
    schema: errorSchema('Unauthorized'),
  })
  @ApiResponse({
    status: 403,
    description: 'Not assigned to this ticket',
    schema: errorSchema('You do not have permission to access this ticket'),
  })
  @ApiResponse({
    status: 404,
    description: 'Ticket not found',
    schema: errorSchema('Support ticket with ID "..." not found'),
  })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.ticketsService.remove(id, req.user);
  }
}
