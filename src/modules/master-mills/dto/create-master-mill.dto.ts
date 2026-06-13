import {
  IsString,
  IsOptional,
  IsUUID,
  IsInt,
  IsDateString,
  IsDecimal,
  IsNotEmpty,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class CreateMasterMillDto {
  @ApiProperty({ example: 'INV-001' })
  @IsString()
  @IsNotEmpty()
  invoice_no: string;

  @ApiProperty({ example: '2024-01-15', required: false })
  @IsDateString()
  @IsOptional()
  invoice_date?: string;

  @ApiProperty({ example: 'P-0005-17-18', required: false })
  @IsString()
  @IsOptional()
  ref_no?: string;

  @ApiProperty({ example: 'uuid-of-mill', required: false })
  @IsUUID()
  @IsOptional()
  mill_id?: string;

  @ApiProperty({ example: 'Old Fatehpura, Udaipur-Jodhpur', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: 'Udaipur-Jodhpur', required: false })
  @IsString()
  @IsOptional()
  place?: string;

  @ApiProperty({ example: 'Rajasthan', required: false })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({ example: '+919876543210', required: false })
  @IsString()
  @IsOptional()
  phone_no?: string;

  @ApiProperty({ example: 'RX-40 B FOR ZX-40', required: false })
  @IsString()
  @IsOptional()
  mc_model?: string;

  @ApiProperty({ example: 'FN-123456', required: false })
  @IsString()
  @IsOptional()
  frame_no?: string;

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

  @ApiProperty({ example: '2024-01-15', required: false })
  @IsDateString()
  @IsOptional()
  installation_date?: string;

  @ApiProperty({ example: '2025-01-15', required: false })
  @IsDateString()
  @IsOptional()
  warranty_closing_date?: string;

  @ApiProperty({ example: 'Non Warranty', required: false })
  @IsString()
  @IsOptional()
  all_warranty?: string;

  @ApiProperty({ example: '2025-01-15', required: false })
  @IsDateString()
  @IsOptional()
  amc_starting_date?: string;

  @ApiProperty({ example: 12, required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  amc_period?: number;

  @ApiProperty({ example: 'Annual Maintenance Contract', required: false })
  @IsString()
  @IsOptional()
  amc_particular?: string;

  @ApiProperty({ example: '2026-01-15', required: false })
  @IsDateString()
  @IsOptional()
  amc_closing_date?: string;

  @ApiProperty({ example: 5000.0, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  amc_amount?: number;

  @ApiProperty({ example: 'ACTIVE', required: false })
  @IsString()
  @IsOptional()
  status?: string;
}
