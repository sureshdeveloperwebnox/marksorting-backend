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
import { ExpenseCategoriesService } from './expense-categories.service';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto';
import { UpdateExpenseCategoryDto } from './dto/update-expense-category.dto';
import { LogActivity } from '../activity-logs/decorators/log-activity.decorator';
import { ActivityAction } from '../activity-logs/enums/activity-action.enum';
import {
  createDescription,
  updateDescription,
  deleteDescription,
  buildDiffSummary,
} from '../activity-logs/helpers/description.helper';

@ApiTags('expense-categories')
@Controller('expense-categories')
export class ExpenseCategoriesController {
  constructor(
    private readonly expenseCategoriesService: ExpenseCategoriesService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get all expense categories with pagination and filtering',
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
    return this.expenseCategoriesService.findAll({
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      search,
      status,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get expense category by ID' })
  findOne(@Param('id') id: string) {
    return this.expenseCategoriesService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new expense category' })
  @LogActivity({
    action: ActivityAction.CREATE,
    entityType: 'expense_categories',
    description: (ctx) => {
      const cat = ctx.result;
      const name = cat?.name || ctx.body.name || 'Unknown';
      const details = ctx.body.description
        ? `Description: ${ctx.body.description}`
        : undefined;
      return createDescription(
        'Expense Category',
        name,
        details,
        ctx.user.full_name,
      );
    },
  })
  create(@Body() dto: CreateExpenseCategoryDto) {
    return this.expenseCategoriesService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update existing expense category' })
  @LogActivity({
    action: ActivityAction.UPDATE,
    entityType: 'expense_categories',
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
        ? `${who} Expense Category "${name}" — ${diff}`
        : `${who} Expense Category "${name}" (no changes detected)`;
    },
  })
  update(@Param('id') id: string, @Body() dto: UpdateExpenseCategoryDto) {
    return this.expenseCategoriesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete expense category' })
  @LogActivity({
    action: ActivityAction.DELETE,
    entityType: 'expense_categories',
    entityIdParam: 'id',
    description: (ctx) => {
      const cat = ctx.result;
      const name = cat?.name || ctx.params.id;
      return deleteDescription('Expense Category', name, ctx.user.full_name);
    },
  })
  remove(@Param('id') id: string) {
    return this.expenseCategoriesService.remove(id);
  }
}
