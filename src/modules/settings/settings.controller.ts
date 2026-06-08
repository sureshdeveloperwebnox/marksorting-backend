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
import { SettingsService } from './settings.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { LogActivity } from '../activity-logs/decorators/log-activity.decorator';
import { ActivityAction } from '../activity-logs/enums/activity-action.enum';
import {
  updateDescription,
  deleteDescription,
  buildDiffSummary,
} from '../activity-logs/helpers/description.helper';

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all settings with pagination and filtering' })
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
    name: 'group',
    required: false,
    type: String,
    description: 'Filter by setting group',
  })
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('group') group?: string,
  ) {
    return this.settingsService.findAll({
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 10,
      search,
      group,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get setting by ID' })
  findOne(@Param('id') id: string) {
    return this.settingsService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new setting' })
  @LogActivity({
    action: ActivityAction.CREATE,
    entityType: 'settings',
    description: (ctx) => {
      const setting = ctx.result;
      const key = setting?.key || ctx.body.key || 'Unknown';
      const value =
        setting?.value !== undefined ? setting.value : ctx.body.value;
      const group =
        setting?.group || ctx.body.group
          ? ` [Group: ${setting?.group || ctx.body.group}]`
          : '';
      const who = ctx.user.full_name
        ? `${ctx.user.full_name} created`
        : 'Created';
      return `${who} Setting "${key}" = "${value}"${group}`;
    },
  })
  create(@Body() dto: CreateSettingDto) {
    return this.settingsService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update existing setting' })
  @LogActivity({
    action: ActivityAction.UPDATE,
    entityType: 'settings',
    entityIdParam: 'id',
    description: (ctx) => {
      const before = ctx.result?.before;
      const after = ctx.result?.after;
      const key = after?.key || before?.key || ctx.params.id;
      const group = after?.group ? ` [Group: ${after.group}]` : '';
      const diff =
        before && after ? buildDiffSummary(before, after, ctx.body) : '';
      const who = ctx.user.full_name
        ? `${ctx.user.full_name} updated`
        : 'Updated';
      return diff
        ? `${who} Setting "${key}${group}" — ${diff}`
        : `${who} Setting "${key}${group}" (no changes detected)`;
    },
  })
  update(@Param('id') id: string, @Body() dto: UpdateSettingDto) {
    return this.settingsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete setting' })
  @LogActivity({
    action: ActivityAction.DELETE,
    entityType: 'settings',
    entityIdParam: 'id',
    description: (ctx) => {
      const setting = ctx.result;
      const key = setting?.key || ctx.params.id;
      const group = setting?.group ? ` [Group: ${setting.group}]` : '';
      return deleteDescription('Setting', key + group, ctx.user.full_name);
    },
  })
  remove(@Param('id') id: string) {
    return this.settingsService.remove(id);
  }
}
