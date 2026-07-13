import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  IsInt,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class QuickRegisterDto {
  @ApiProperty({ example: 'Ravi Kumar', required: false })
  @IsString()
  @IsOptional()
  customer_name?: string;

  @ApiProperty({
    example: 'c10d2e3f-4a5b-6c7d-8e9f-0a1b2c3d4e5f',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  customer_id?: string;

  @ApiProperty({ example: 'Golden Valley Mill' })
  @IsString()
  @IsNotEmpty()
  mill_name: string;

  @ApiProperty({ example: 'REF-001' })
  @IsString()
  @IsNotEmpty()
  ref_no: string;

  @ApiProperty({ example: 'FN-123456', required: false })
  @IsString()
  @IsOptional()
  frame_no?: string;

  @ApiProperty({ example: '2024-01-15', required: true })
  @IsDateString()
  @IsNotEmpty()
  mfg_date: string;

  @ApiProperty({ example: 'RX-40 B FOR ZX-40', required: false })
  @IsString()
  @IsOptional()
  mc_model?: string;

  @ApiProperty({ example: '123 Mill Lane, Valley View', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: 'Kurud' })
  @IsString()
  @IsNotEmpty()
  place: string;

  @ApiProperty({ example: 'Chhattisgarh', required: false })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({ example: '+919876543210', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'contact@goldenvalley.com', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'Installation', required: false })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({ example: 'INV-001', required: false })
  @IsString()
  @IsOptional()
  invoice_no?: string;

  @ApiProperty({ example: '2024-01-15', required: false })
  @IsDateString()
  @IsOptional()
  invoice_date?: string;

  @ApiProperty({ example: '2024-01-15', required: false })
  @IsDateString()
  @IsOptional()
  installation_date?: string;

  @ApiProperty({ example: '2024-01-15', required: false })
  @IsDateString()
  @IsOptional()
  warranty_start_date?: string;

  @ApiProperty({ example: 1, required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  warranty_years?: number;

  @ApiProperty({ example: 12, required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  warranty_months?: number;

  @ApiProperty({ example: '2024-02-01', required: false })
  @IsDateString()
  @IsOptional()
  amc_starting_date?: string;

  @ApiProperty({ example: '2025-02-01', required: false })
  @IsDateString()
  @IsOptional()
  amc_closing_date?: string;

  @ApiProperty({ example: 12, required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  amc_period?: number;

  @ApiProperty({ example: 5000, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  amc_amount?: number;

  @ApiProperty({ example: 'Annual Maintenance Contract', required: false })
  @IsString()
  @IsOptional()
  amc_particulars?: string;
}
