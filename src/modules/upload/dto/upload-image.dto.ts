import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadImageDto {
  @ApiProperty({
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
    description: 'Base64 encoded image data (with or without data URI prefix)',
  })
  @IsString()
  @IsNotEmpty()
  image: string;

  @ApiProperty({
    example: 'expense-image.png',
    description: 'Optional original filename',
    required: false,
  })
  @IsString()
  @IsOptional()
  fileName?: string;
}
