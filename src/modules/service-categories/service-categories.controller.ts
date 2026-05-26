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
import { ServiceCategoriesService } from './service-categories.service';
import { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import { UpdateServiceCategoryDto } from './dto/update-service-category.dto';

@ApiTags('service-categories')
@Controller('service-categories')
export class ServiceCategoriesController {
  constructor(
    private readonly serviceCategoriesService: ServiceCategoriesService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get all service categories with pagination and filtering',
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
    description: 'Search term',
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
    return this.serviceCategoriesService.findAll({
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      search,
      status,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service category by ID' })
  findOne(@Param('id') id: string) {
    return this.serviceCategoriesService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new service category' })
  create(@Body() dto: CreateServiceCategoryDto) {
    return this.serviceCategoriesService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update existing service category' })
  update(@Param('id') id: string, @Body() dto: UpdateServiceCategoryDto) {
    return this.serviceCategoriesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete service category' })
  remove(@Param('id') id: string) {
    return this.serviceCategoriesService.remove(id);
  }
}
