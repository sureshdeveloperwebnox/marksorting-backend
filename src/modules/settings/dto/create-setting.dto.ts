import {
    IsNotEmpty,
    IsString,
    IsIn,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSettingDto {
    @ApiProperty({ example: 'site_title' })
    @IsString()
    @IsNotEmpty()
    key: string;

    @ApiProperty({ example: 'Mark Sorting System' })
    @IsString()
    @IsNotEmpty()
    value: string;

    @ApiProperty({
        example: 'GENERAL',
        enum: ['GENERAL', 'APP', 'PAYMENT', 'NOTIFICATION', 'SECURITY'],
    })
    @IsIn(['GENERAL', 'APP', 'PAYMENT', 'NOTIFICATION', 'SECURITY'])
    group: string;
}
