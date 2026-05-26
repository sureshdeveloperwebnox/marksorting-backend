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
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ExpenseCategoriesService } from './expense-categories.service';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto';
import { UpdateExpenseCategoryDto } from './dto/update-expense-category.dto';

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
  create(@Body() dto: CreateExpenseCategoryDto) {
    return this.expenseCategoriesService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update existing expense category' })
  update(@Param('id') id: string, @Body() dto: UpdateExpenseCategoryDto) {
    return this.expenseCategoriesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete expense category' })
  remove(@Param('id') id: string) {
    return this.expenseCategoriesService.remove(id);
  }
}
