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
  getSchemaPath,
} from '@nestjs/swagger';
import { ExpensesService } from './expenses.service';
import { CreateMobileExpenseDto } from './dto/create-mobile-expense.dto';
import { UpdateMobileExpenseDto } from './dto/update-mobile-expense.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// ── Reusable inline schema fragments ────────────────────────────────────────

const technicianSchema = {
  type: 'object',
  properties: {
    technician_id: { type: 'string', format: 'uuid' },
    technician: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        full_name: { type: 'string', example: 'Ravi Kumar' },
      },
    },
  },
};

const expenseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid', example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
    expense_number: { type: 'string', example: 'EXP-20260526-1' },
    mill_id: { type: 'string', format: 'uuid', nullable: true, example: null },
    place: { type: 'string', nullable: true, example: 'Coimbatore' },
    visit_date: { type: 'string', format: 'date-time', example: '2026-05-26T00:00:00.000Z' },
    visit_time: { type: 'string', example: '10:30' },
    expense_category_id: { type: 'string', format: 'uuid', example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
    others: { type: 'string', nullable: true, example: 'Taxi to mill' },
    amount: { type: 'string', example: '1500' },
    expense_images: { type: 'array', items: { type: 'string' }, example: [] },
    status: {
      type: 'string',
      enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      example: 'PENDING',
    },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' },
    deleted_at: { type: 'string', format: 'date-time', nullable: true },
    mill: {
      nullable: true,
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string', example: 'ABC Mill' },
      },
    },
    expenseCategory: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string', example: 'Travel' },
      },
    },
    technicians: {
      type: 'array',
      items: technicianSchema,
    },
  },
};

const paginatedExpensesSchema = {
  type: 'object',
  properties: {
    expenses: { type: 'array', items: expenseSchema },
    total: { type: 'integer', example: 42 },
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

@ApiTags('mobile / expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('mobile/expenses')
export class MobileExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  // ── GET / ─────────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({
    summary: '[Mobile] List expenses for the logged-in engineer',
    description:
      '**Role-based filtering:**\n' +
      '- **Service Engineer** – only expenses they are assigned to are returned.\n' +
      '- **Other roles** (Admin, Manager…) – all expenses are returned.\n\n' +
      'Results are paginated and ordered by `created_at DESC`.',
  })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Offset — number of records to skip (default `0`)' })
  @ApiQuery({ name: 'take', required: false, type: Number, description: 'Page size — number of records to return (default `10`)' })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description:
      'Full-text search across `expense_number`, `place`, `others`, mill name, and category name (case-insensitive)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    description: 'Filter by expense status',
  })
  @ApiQuery({ name: 'dateFrom', required: false, type: String, description: 'Visit date lower bound — ISO date string `YYYY-MM-DD`' })
  @ApiQuery({ name: 'dateTo',   required: false, type: String, description: 'Visit date upper bound — ISO date string `YYYY-MM-DD`' })
  @ApiResponse({ status: 200, description: 'Paginated list of expenses', schema: paginatedExpensesSchema })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT bearer token', schema: errorSchema('Unauthorized') })
  findAll(
    @Request() req: any,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.expensesService.findAll(
      {
        skip: skip ? parseInt(skip, 10) : 0,
        take: take ? parseInt(take, 10) : 10,
        search,
        status,
        dateFrom,
        dateTo,
      },
      req.user,
    );
  }

  // ── GET /:id ──────────────────────────────────────────────────────────────

  @Get(':id')
  @ApiOperation({
    summary: '[Mobile] Get a single expense by ID',
    description:
      'Returns full expense detail including assigned technicians, mill, and category.\n\n' +
      'Service Engineers receive **403** if they are not assigned to the expense.',
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid', description: 'Expense UUID' })
  @ApiResponse({ status: 200, description: 'Expense detail',                       schema: expenseSchema })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT bearer token',  schema: errorSchema('Unauthorized') })
  @ApiResponse({ status: 403, description: 'Not assigned to this expense',         schema: errorSchema('You do not have permission to access this expense') })
  @ApiResponse({ status: 404, description: 'Expense not found',                    schema: errorSchema('Expense with ID "..." not found') })
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.expensesService.findById(id, req.user);
  }

  // ── POST / ────────────────────────────────────────────────────────────────

  @Post()
  @ApiOperation({
    summary: '[Mobile] Create a new expense',
    description:
      'Creates a new expense record and returns it with all relations populated.\n\n' +
      '**Auto-assignment rule:** When a `Service Engineer` submits this request, their ID is automatically ' +
      'appended to `technician_ids` even if the field is omitted from the payload. ' +
      'You may therefore send a minimal body without `technician_ids` from the mobile app.\n\n' +
      '**Validation:** All referenced IDs (`expense_category_id`, `mill_id`, `technician_ids`) are ' +
      'verified to exist in the database before creation. Invalid IDs return **400**.',
  })
  @ApiBody({
    type: CreateMobileExpenseDto,
  })
  @ApiResponse({ status: 201, description: 'Expense created successfully',          schema: expenseSchema })
  @ApiResponse({
    status: 400,
    description: 'Validation error — invalid UUID, missing required field, or referenced entity not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'integer', example: 400 },
        message: {
          oneOf: [
            { type: 'string',  example: 'Expense category with ID "..." not found' },
            { type: 'string',  example: 'Mill with ID "..." not found' },
            { type: 'string',  example: 'One or more technician IDs are invalid' },
            { type: 'string',  example: 'At least one technician ID is required' },
            { type: 'array',   items: { type: 'string' }, example: ['visit_date must be a valid ISO 8601 date string'] },
          ],
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT bearer token',   schema: errorSchema('Unauthorized') })
  create(@Body() dto: CreateMobileExpenseDto, @Request() req: any) {
    return this.expensesService.create(dto, req.user);
  }

  // ── PUT /:id ──────────────────────────────────────────────────────────────

  @Put(':id')
  @ApiOperation({
    summary: '[Mobile] Update an existing expense',
    description:
      'Performs a **partial update** — only fields present in the request body are changed.\n\n' +
      'When `technician_ids` is provided, the existing technician assignment list is **fully replaced**.\n\n' +
      'Service Engineers receive **403** if they are not assigned to the expense.',
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid', description: 'Expense UUID to update' })
  @ApiBody({
    type: UpdateMobileExpenseDto,
  })
  @ApiResponse({ status: 200, description: 'Expense updated successfully',         schema: expenseSchema })
  @ApiResponse({ status: 400, description: 'Validation error or invalid reference', schema: errorSchema('Expense category with ID "..." not found') })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT bearer token',  schema: errorSchema('Unauthorized') })
  @ApiResponse({ status: 403, description: 'Not assigned to this expense',         schema: errorSchema('You do not have permission to access this expense') })
  @ApiResponse({ status: 404, description: 'Expense not found',                    schema: errorSchema('Expense with ID "..." not found') })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMobileExpenseDto,
    @Request() req: any,
  ) {
    return this.expensesService.update(id, dto, req.user);
  }

  // ── DELETE /:id ───────────────────────────────────────────────────────────

  @Delete(':id')
  @ApiOperation({
    summary: '[Mobile] Soft-delete an expense',
    description:
      'Sets `deleted_at` to the current timestamp — the record is **not** physically removed.\n\n' +
      'Service Engineers receive **403** if they are not assigned to the expense.',
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid', description: 'Expense UUID to delete' })
  @ApiResponse({ status: 200, description: 'Expense soft-deleted — returns the updated record', schema: expenseSchema })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT bearer token',  schema: errorSchema('Unauthorized') })
  @ApiResponse({ status: 403, description: 'Not assigned to this expense',         schema: errorSchema('You do not have permission to access this expense') })
  @ApiResponse({ status: 404, description: 'Expense not found',                    schema: errorSchema('Expense with ID "..." not found') })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.expensesService.remove(id, req.user);
  }
}
