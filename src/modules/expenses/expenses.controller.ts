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
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { LogActivity } from '../activity-logs/decorators/log-activity.decorator';
import { ActivityAction } from '../activity-logs/enums/activity-action.enum';
import {
  updateDescription,
  deleteDescription,
  buildDiffSummary,
} from '../activity-logs/helpers/description.helper';

@ApiTags('expenses')
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all expenses with pagination and filtering' })
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
    name: 'dateFrom',
    required: false,
    type: String,
    description: 'Filter from visit date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    type: String,
    description: 'Filter to visit date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'technicianId',
    required: false,
    type: String,
    description: 'Filter by technician/service engineer ID',
  })
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('technicianId') technicianId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.expensesService.findAll({
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 10,
      search,
      status,
      technicianId,
      dateFrom,
      dateTo,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get expense by ID' })
  findOne(@Param('id') id: string) {
    return this.expensesService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new expense' })
  @LogActivity({
    action: ActivityAction.CREATE,
    entityType: 'expenses',
    description: (ctx) => {
      const expense = ctx.result;
      const expNo = expense?.expense_number || 'N/A';
      const parts = [
        expense?.expenseCategory?.name
          ? `Category: ${expense.expenseCategory.name}`
          : null,
        expense?.amount ? `Amount: ₹${expense.amount}` : null,
        expense?.mill?.name ? `Mill: ${expense.mill.name}` : null,
        expense?.place ? `Place: ${expense.place}` : null,
        expense?.status ? `Status: ${expense.status}` : null,
      ]
        .filter(Boolean)
        .join(', ');
      const who = ctx.user.full_name
        ? `${ctx.user.full_name} created`
        : 'Created';
      return `${who} Expense "${expNo}"` + (parts ? ` — ${parts}` : '');
    },
  })
  create(@Body() dto: CreateExpenseDto) {
    return this.expensesService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update existing expense' })
  @LogActivity({
    action: ActivityAction.UPDATE,
    entityType: 'expenses',
    entityIdParam: 'id',
    description: (ctx) => {
      const before = ctx.result?.before;
      const after = ctx.result?.after;
      const expNo =
        after?.expense_number || before?.expense_number || ctx.params.id;
      const diff =
        before && after ? buildDiffSummary(before, after, ctx.body) : '';
      const who = ctx.user.full_name
        ? `${ctx.user.full_name} updated`
        : 'Updated';
      return diff
        ? `${who} Expense "${expNo}" — ${diff}`
        : `${who} Expense "${expNo}" (no changes detected)`;
    },
  })
  update(@Param('id') id: string, @Body() dto: UpdateExpenseDto) {
    return this.expensesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete expense' })
  @LogActivity({
    action: ActivityAction.DELETE,
    entityType: 'expenses',
    entityIdParam: 'id',
    description: (ctx) => {
      const expense = ctx.result;
      const expNo = expense?.expense_number || ctx.params.id;
      return deleteDescription('Expense', expNo, ctx.user.full_name);
    },
  })
  remove(@Param('id') id: string) {
    return this.expensesService.remove(id);
  }
}
