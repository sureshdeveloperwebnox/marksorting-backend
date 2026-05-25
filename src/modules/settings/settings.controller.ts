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
import { SettingsService } from './settings.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) { }

    @Get()
    @ApiOperation({ summary: 'Get all settings with pagination and filtering' })
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
    create(@Body() dto: CreateSettingDto) {
        return this.settingsService.create(dto);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update existing setting' })
    update(@Param('id') id: string, @Body() dto: UpdateSettingDto) {
        return this.settingsService.update(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete setting' })
    remove(@Param('id') id: string) {
        return this.settingsService.remove(id);
    }
}
