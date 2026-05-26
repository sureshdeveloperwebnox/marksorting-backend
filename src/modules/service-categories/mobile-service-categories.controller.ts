import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ServiceCategoriesService } from './service-categories.service';

@ApiTags('mobile / lookup')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('mobile/service-categories')
export class MobileServiceCategoriesController {
  constructor(
    private readonly serviceCategoriesService: ServiceCategoriesService,
  ) {}

  @Get()
  @ApiOperation({
    summary: '[Mobile] List active service categories for report creation',
    description:
      'Returns a paginated list of active service categories. ' +
      'Use this to populate the category selector when creating a service/installation report.',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    type: String,
    description: 'Offset (default 0)',
  })
  @ApiQuery({
    name: 'take',
    required: false,
    type: String,
    description: 'Page size (default 100)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by category name or description',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of service categories',
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
  ) {
    return this.serviceCategoriesService.findAll({
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 100,
      search,
      status: 'ACTIVE',
    });
  }
}
