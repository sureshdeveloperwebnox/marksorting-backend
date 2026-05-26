import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateExpenseDto {
  @ApiProperty({
    example: ['uuid-of-technician-1', 'uuid-of-technician-2'],
    type: [String],
  })
  @IsArray()
  @IsUUID('all', { each: true })
  @ArrayMinSize(1)
  technician_ids: string[];

  @ApiProperty({ example: 'uuid-of-mill', required: false })
  @IsUUID()
  @IsOptional()
  mill_id?: string;

  @ApiProperty({ example: 'Coimbatore', required: false })
  @IsString()
  @IsOptional()
  place?: string;

  @ApiProperty({ example: '2026-05-23' })
  @IsDateString()
  visit_date: string;

  @ApiProperty({ example: '10:30' })
  @IsString()
  @IsNotEmpty()
  visit_time: string;

  @ApiProperty({ example: 'uuid-of-expense-category' })
  @IsUUID()
  @IsNotEmpty()
  expense_category_id: string;

  @ApiProperty({ example: 'Taxi to mill', required: false })
  @IsString()
  @IsOptional()
  others?: string;

  @ApiProperty({ example: 1500, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number;

  @ApiProperty({
    example: ['expense-image-key-1.jpg', 'expense-image-key-2.jpg'],
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  expense_images?: string[];

  @ApiProperty({
    example: 'PENDING',
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    required: false,
  })
  @IsIn(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
  @IsOptional()
  status?: string;
}
