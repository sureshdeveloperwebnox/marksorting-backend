import {
  Controller,
  Get,
  Put,
  Param,
  Body,
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
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StoresService } from './stores.service';
import { UpdateStoreReturnDto } from './dto/update-store-return.dto';
import { LogActivity } from '../activity-logs/decorators/log-activity.decorator';
import { ActivityAction } from '../activity-logs/enums/activity-action.enum';
import { buildDiffSummary } from '../activity-logs/helpers/description.helper';

@ApiTags('mobile / store-returns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('mobile/store-returns')
export class MobileStoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get()
  @ApiOperation({
    summary: '[Mobile] List pending store returns for the logged-in engineer',
    description: 'Returns a list of store records with "Pending" return status assigned to the logged-in technician.',
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
    description: 'Page size (default 10)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by frame number, barcode or customer name',
  })
  @ApiResponse({ status: 200, description: 'Paginated list of pending store returns' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  findAll(
    @Request() req: any,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
  ) {
    return this.storesService.findPendingByTechnician(req.user.id, {
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 10,
      search,
    });
  }

  @Put(':id')
  @ApiOperation({
    summary: '[Mobile] Submit store return details',
    description: 'Submits courier/provider name and invoice/receipt number to complete a store return. The status transitions to completed.',
  })
  @ApiBody({ type: UpdateStoreReturnDto })
  @ApiResponse({ status: 200, description: 'Store return completed successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or status is not Pending' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden from updating another engineer\'s store record' })
  @ApiResponse({ status: 404, description: 'Store record not found' })
  @LogActivity({
    action: ActivityAction.UPDATE,
    entityType: 'stores',
    entityIdParam: 'id',
    description: (ctx) => {
      const before = ctx.result?.before;
      const after = ctx.result?.after;
      const frame = after?.frame_number || before?.frame_number || ctx.params.id;
      const diff = before && after ? buildDiffSummary(before, after, ctx.body) : '';
      const who = ctx.user.full_name ? `${ctx.user.full_name} completed return` : 'Completed return';
      return `${who} for Store Record "Frame ${frame}" — ${diff || 'updated return details'}`;
    },
  })
  submitReturn(
    @Param('id') id: string,
    @Body() dto: UpdateStoreReturnDto,
    @Request() req: any,
  ) {
    return this.storesService.submitReturnDetails(id, req.user.id, dto);
  }
}
