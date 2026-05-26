import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateServiceCategoryDto {
  @ApiProperty({ example: 'Maintenance' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Routine maintenance services', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'ACTIVE', required: false })
  @IsString()
  @IsOptional()
  status?: string;
}
