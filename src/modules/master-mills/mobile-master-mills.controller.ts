import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MasterMillsService } from './master-mills.service';
import { QuickRegisterDto } from './dto/quick-register.dto';

@ApiTags('mobile / lookup')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('mobile/master-mills')
export class MobileMasterMillsController {
  constructor(private readonly masterMillsService: MasterMillsService) {}

  @Get('prefill')
  @ApiOperation({
    summary: '[Mobile] Search machine records by Ref No or Frame No for prefilling forms',
    description: 'Returns a list of matching active Master Mill records with nested Mill and Customer details.',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search term matching Ref No or Frame No (partial)',
  })
  @ApiQuery({
    name: 'ref_no',
    required: false,
    type: String,
    description: 'Specific Ref No to query (partial)',
  })
  @ApiQuery({
    name: 'frame_no',
    required: false,
    type: String,
    description: 'Specific Frame No to query (partial)',
  })
  @ApiResponse({ status: 200, description: 'Matched master mill records' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  findForPrefill(
    @Query('search') search?: string,
    @Query('ref_no') refNo?: string,
    @Query('frame_no') frameNo?: string,
  ) {
    return this.masterMillsService.findForPrefill(search, refNo, frameNo);
  }

  @Post('quick-register')
  @ApiOperation({
    summary: '[Mobile] Quick register Customer, Mill, and Master Mill',
    description: 'Creates or updates Customer, Mill, and Master Mill record based on the payload, ensuring reuse where they already exist.',
  })
  @ApiBody({ type: QuickRegisterDto })
  @ApiResponse({ status: 201, description: 'Quick registration successful' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  quickRegister(@Body() dto: QuickRegisterDto) {
    return this.masterMillsService.quickRegister(dto);
  }
}
