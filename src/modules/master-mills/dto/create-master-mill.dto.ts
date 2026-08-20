import {
  IsString,
  IsOptional,
  IsUUID,
  IsInt,
  IsDateString,
  IsNotEmpty,
  Min,
  IsNumber,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

/** Converts empty strings to null so @IsOptional() correctly skips validation
 *  for blank form fields, while allowing fields to be explicitly cleared in the database. */
const emptyStringToNull = Transform(({ value }) =>
  value === '' ? null : value,
);

export class CreateMasterMillDto {
  @ApiProperty({ example: 'INV-001' })
  @IsString()
  @IsNotEmpty()
  invoice_no: string;

  @ApiProperty({ example: '2024-01-15', required: false })
  @IsDateString()
  @IsOptional()
  @emptyStringToNull
  invoice_date?: string;

  @ApiProperty({ example: 'P-0005-17-18', required: false })
  @IsString()
  @IsOptional()
  @emptyStringToNull
  ref_no?: string;

  @ApiProperty({ example: 'uuid-of-mill', required: false })
  @IsUUID()
  @IsOptional()
  @emptyStringToNull
  mill_id?: string;

  @ApiProperty({ example: 'Old Fatehpura, Udaipur-Jodhpur', required: false })
  @IsString()
  @IsOptional()
  @emptyStringToNull
  address?: string;

  @ApiProperty({ example: 'Udaipur-Jodhpur', required: false })
  @IsString()
  @IsOptional()
  @emptyStringToNull
  place?: string;

  @ApiProperty({ example: 'Rajasthan', required: false })
  @IsString()
  @IsOptional()
  @emptyStringToNull
  state?: string;

  @ApiProperty({ example: '+919876543210', required: false })
  @IsString()
  @IsOptional()
  @emptyStringToNull
  phone_no?: string;

  @ApiProperty({ example: 'RX-40 B FOR ZX-40', required: false })
  @IsString()
  @IsOptional()
  @emptyStringToNull
  mc_model?: string;

  @ApiProperty({ example: 'FN-123456', required: false })
  @IsString()
  @IsOptional()
  @emptyStringToNull
  frame_no?: string;

  @ApiProperty({ example: '2024-01-15', required: true })
  @IsDateString()
  @IsNotEmpty()
  mfg_date: string;

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
  @emptyStringToNull
  installation_date?: string;

  @ApiProperty({ example: '2024-01-15', required: false })
  @IsDateString()
  @IsOptional()
  @emptyStringToNull
  warranty_start_date?: string;

  @ApiProperty({ example: '2025-01-15', required: false })
  @IsDateString()
  @IsOptional()
  @emptyStringToNull
  warranty_closing_date?: string;

  @ApiProperty({ example: 'Non Warranty', required: false })
  @IsString()
  @IsOptional()
  @emptyStringToNull
  all_warranty?: string;

  @ApiProperty({ example: '2025-01-15', required: false })
  @IsDateString()
  @IsOptional()
  @emptyStringToNull
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
  @emptyStringToNull
  amc_particular?: string;

  @ApiProperty({ example: '2026-01-15', required: false })
  @IsDateString()
  @IsOptional()
  @emptyStringToNull
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
  @emptyStringToNull
  status?: string;
}
