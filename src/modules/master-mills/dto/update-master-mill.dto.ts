import { PartialType, ApiProperty } from '@nestjs/swagger';
import { CreateMasterMillDto } from './create-master-mill.dto';
import { IsDateString, IsNotEmpty } from 'class-validator';

export class UpdateMasterMillDto extends PartialType(CreateMasterMillDto) {
  @ApiProperty({ example: '2024-01-15', required: true })
  @IsDateString()
  @IsNotEmpty()
  mfg_date: string;
}
