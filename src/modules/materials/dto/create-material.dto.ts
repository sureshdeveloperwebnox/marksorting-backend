import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMaterialDto {
  @ApiProperty({ example: 'Sensor Pro 5' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'High precision sorting sensor', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'ACTIVE', required: false })
  @IsString()
  @IsOptional()
  status?: string;
}
