import { PartialType, ApiProperty } from '@nestjs/swagger';
import { CreateMasterMillDto } from './create-master-mill.dto';
import { IsDateString, IsOptional } from 'class-validator';

export class UpdateMasterMillDto extends PartialType(CreateMasterMillDto) {
  @ApiProperty({ example: '2024-01-15', required: false })
  @IsDateString()
  @IsOptional()
  mfg_date?: string;
}

