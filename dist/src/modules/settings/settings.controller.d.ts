import { SettingsService } from './settings.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
export declare class SettingsController {
    private readonly settingsService;
    constructor(settingsService: SettingsService);
    findAll(skip?: string, take?: string, search?: string, group?: string): Promise<any>;
    findOne(id: string): Promise<any>;
    create(dto: CreateSettingDto): Promise<any>;
    update(id: string, dto: UpdateSettingDto): Promise<{
        before: any;
        after: any;
    }>;
    remove(id: string): Promise<any>;
}
