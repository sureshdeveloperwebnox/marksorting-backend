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

/** Converts empty strings to undefined so @IsOptional() + @IsDateString()
 *  / @IsUUID() validators correctly skip validation for blank form fields. */
const emptyStringToUndefined = Transform(({ value }) =>
  value === '' || value === null ? undefined : value,
);

export class CreateMasterMillDto {
  @ApiProperty({ example: 'INV-001' })
  @IsString()
  @IsNotEmpty()
  invoice_no: string;

  @ApiProperty({ example: 'Installation', required: false })
  @IsString()
  @IsOptional()
  @emptyStringToUndefined
  type?: string;

  @ApiProperty({ example: '2024-01-15', required: false })
  @IsDateString()
  @IsOptional()
  @emptyStringToUndefined
  invoice_date?: string;

  @ApiProperty({ example: 'P-0005-17-18', required: false })
  @IsString()
  @IsOptional()
  @emptyStringToUndefined
  ref_no?: string;

  @ApiProperty({ example: 'uuid-of-mill', required: false })
  @IsUUID()
  @IsOptional()
  @emptyStringToUndefined
  mill_id?: string;

  @ApiProperty({ example: 'Old Fatehpura, Udaipur-Jodhpur', required: false })
  @IsString()
  @IsOptional()
  @emptyStringToUndefined
  address?: string;

  @ApiProperty({ example: 'Udaipur-Jodhpur', required: false })
  @IsString()
  @IsOptional()
  @emptyStringToUndefined
  place?: string;

  @ApiProperty({ example: 'Rajasthan', required: false })
  @IsString()
  @IsOptional()
  @emptyStringToUndefined
  state?: string;

  @ApiProperty({ example: '+919876543210', required: false })
  @IsString()
  @IsOptional()
  @emptyStringToUndefined
  phone_no?: string;

  @ApiProperty({ example: 'RX-40 B FOR ZX-40', required: false })
  @IsString()
  @IsOptional()
  @emptyStringToUndefined
  mc_model?: string;

  @ApiProperty({ example: 'FN-123456', required: false })
  @IsString()
  @IsOptional()
  @emptyStringToUndefined
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
  @emptyStringToUndefined
  installation_date?: string;

  @ApiProperty({ example: '2024-01-15', required: false })
  @IsDateString()
  @IsOptional()
  @emptyStringToUndefined
  warranty_start_date?: string;

  @ApiProperty({ example: '2025-01-15', required: false })
  @IsDateString()
  @IsOptional()
  @emptyStringToUndefined
  warranty_closing_date?: string;

  @ApiProperty({ example: 'Non Warranty', required: false })
  @IsString()
  @IsOptional()
  @emptyStringToUndefined
  all_warranty?: string;

  @ApiProperty({ example: '2025-01-15', required: false })
  @IsDateString()
  @IsOptional()
  @emptyStringToUndefined
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
  @emptyStringToUndefined
  amc_particular?: string;

  @ApiProperty({ example: '2026-01-15', required: false })
  @IsDateString()
  @IsOptional()
  @emptyStringToUndefined
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
  @emptyStringToUndefined
  status?: string;
}
