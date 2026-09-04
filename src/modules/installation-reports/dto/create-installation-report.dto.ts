import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

const emptyToUndefined = ({ value }: { value: any }) =>
  value === '' || value === null ? undefined : value;

export class CreateInstallationReportDto {
  @ApiProperty({
    example: ['uuid-of-technician-1', 'uuid-of-technician-2'],
    type: [String],
  })
  @IsArray()
  @IsUUID('all', { each: true })
  @ArrayMinSize(1)
  technician_ids: string[];

  @ApiProperty({ example: 'uuid-of-customer', required: false })
  @Transform(emptyToUndefined)
  @IsUUID()
  @IsOptional()
  customer_id?: string;

  @ApiProperty({ example: 'uuid-of-mill' })
  @IsUUID()
  mill_id: string;

  @ApiProperty({ example: 'Coimbatore' })
  @IsString()
  @IsNotEmpty()
  place: string;

  @ApiProperty({ example: '+919876543210', required: false })
  @Transform(emptyToUndefined)
  @IsString()
  @IsOptional()
  mill_whatsapp_number?: string;

  @ApiProperty({ example: '2026-05-23' })
  @IsDateString()
  visit_date: string;

  @ApiProperty({ example: '10:30', required: false })
  @Transform(emptyToUndefined)
  @IsString()
  @IsOptional()
  visit_time?: string;

  @ApiProperty({ example: '2026-05-20' })
  @IsDateString()
  call_registered_date: string;

  @ApiProperty({ example: 'MarkSort Pro 500' })
  @IsString()
  @IsNotEmpty()
  machine_model: string;

  @ApiProperty({ example: '2020-03-01', required: false })
  @Transform(emptyToUndefined)
  @IsDateString()
  @IsOptional()
  machine_mfg_date?: string;

  @ApiProperty({ example: 'SN-2026-00123' })
  @IsString()
  @IsNotEmpty()
  serial_or_frame_no: string;

  @ApiProperty({ example: 'Rajesh Kumar' })
  @IsString()
  @IsNotEmpty()
  authorized_person: string;

  @ApiProperty({ example: '+919876543210', required: false })
  @Transform(emptyToUndefined)
  @IsString()
  @IsOptional()
  authorized_person_phone?: string;

  @ApiProperty({ example: 'IR-INV-100234', required: false })
  @Transform(emptyToUndefined)
  @IsString()
  @IsOptional()
  invoice_number?: string;

  @ApiProperty({ example: '2026-05-15', required: false })
  @Transform(emptyToUndefined)
  @IsDateString()
  @IsOptional()
  invoice_date?: string;

  @ApiProperty({ example: '2026-05-23', required: false })
  @Transform(emptyToUndefined)
  @IsDateString()
  @IsOptional()
  warranty_start_date?: string;

  @ApiProperty({ example: '2027-05-23', required: false })
  @Transform(emptyToUndefined)
  @IsDateString()
  @IsOptional()
  warranty_end_date?: string;

  @ApiProperty({ example: 1, required: false })
  @Transform(emptyToUndefined)
  @IsInt()
  @Min(0)
  @IsOptional()
  warranty_years?: number;

  @ApiProperty({ example: 0, required: false })
  @Transform(emptyToUndefined)
  @IsInt()
  @Min(0)
  @IsOptional()
  warranty_months?: number;

  @ApiProperty({ example: 'Rice', required: false })
  @Transform(emptyToUndefined)
  @IsString()
  @IsOptional()
  commodity?: string;

  @ApiProperty({ example: '2%', required: false })
  @Transform(emptyToUndefined)
  @IsString()
  @IsOptional()
  contamination?: string;

  @ApiProperty({ example: '500 kg/hr', required: false })
  @Transform(emptyToUndefined)
  @IsString()
  @IsOptional()
  output_capacity_per_hour?: string;

  @ApiProperty({ example: '0.5%', required: false })
  @Transform(emptyToUndefined)
  @IsString()
  @IsOptional()
  rejection_ratio?: string;

  @ApiProperty({ example: '99.5%', required: false })
  @Transform(emptyToUndefined)
  @IsString()
  @IsOptional()
  purity?: string;

  @ApiProperty({ example: 5, required: false })
  @Transform(emptyToUndefined)
  @IsInt()
  @Min(0)
  @IsOptional()
  no_of_programs_set?: number;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  ac_provided?: boolean;

  @ApiProperty({ example: 'Atlas Copco GA11, 11 kW', required: false })
  @Transform(emptyToUndefined)
  @IsString()
  @IsOptional()
  compressor_details?: string;

  @ApiProperty({ example: 'Refrigerated type, working fine', required: false })
  @Transform(emptyToUndefined)
  @IsString()
  @IsOptional()
  air_drier_details?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  ground_earth_provided?: boolean;

  @ApiProperty({ example: 5, required: false, description: 'Running Channel count or index (1-12)' })
  @Transform(emptyToUndefined)
  @IsInt()
  @Min(0)
  @Max(12)
  @IsOptional()
  running_channel_combination?: number;

  @ApiProperty({
    example: '[{"channel":1,"value":"PRIMARY"},{"channel":7,"value":"SECONDARY"}]',
    required: false,
    description: 'Running Channel Combination Value (JSON string array or legacy single value: PRIMARY | SECONDARY | REJECTION_1 | REJECTION_2 | SPLIT)',
  })
  @Transform(emptyToUndefined)
  @IsString()
  @IsOptional()
  running_channel_combination_value?: string;

  @ApiProperty({ example: 3, required: false })
  @Transform(emptyToUndefined)
  @IsInt()
  @Min(0)
  @IsOptional()
  no_of_filters_installed?: number;

  @ApiProperty({ example: 'Good', required: false })
  @Transform(emptyToUndefined)
  @IsString()
  @IsOptional()
  oil_filter_condition?: string;

  @ApiProperty({ example: 'Clean', required: false })
  @Transform(emptyToUndefined)
  @IsString()
  @IsOptional()
  line_filter_condition?: string;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  auto_drain_valve_working?: boolean;

  @ApiProperty({ example: 'Machine is now operating within normal parameters' })
  @IsString()
  @IsNotEmpty()
  engineer_remarks: string;

  @ApiProperty({ example: 'data:image/png;base64,...' })
  @IsString()
  @IsNotEmpty()
  engineer_signature: string;

  @ApiProperty({ example: 'data:image/png;base64,...', required: false })
  @Transform(emptyToUndefined)
  @IsString()
  @IsOptional()
  customer_signature?: string;

  @ApiProperty({ example: 'mill@example.com', required: false })
  @Transform(emptyToUndefined)
  @IsString()
  @IsOptional()
  mill_email?: string;

  @ApiProperty({ example: 'Satisfied with the installation', required: false })
  @Transform(emptyToUndefined)
  @IsString()
  @IsOptional()
  customer_remarks?: string;

  @ApiProperty({
    example: 'PENDING',
    enum: ['PENDING', 'COMPLETED', 'NON_SUCCEED', 'CANCELLED', 'IN_PROGRESS'],
    required: false,
  })
  @Transform(emptyToUndefined)
  @IsIn(['PENDING', 'COMPLETED', 'NON_SUCCEED', 'CANCELLED', 'IN_PROGRESS'])
  @IsOptional()
  status?: string;

  // ── AMC Fields (sent by mobile app) ──────────────────────────────────────────

  @ApiProperty({ example: 18, required: false })
  @Transform(emptyToUndefined)
  @IsInt()
  @Min(0)
  @IsOptional()
  amc_period?: number;

  @ApiProperty({ example: '2026-08-15', required: false })
  @Transform(emptyToUndefined)
  @IsDateString()
  @IsOptional()
  amc_start_date?: string;

  @ApiProperty({ example: '2026-08-15', required: false })
  @Transform(emptyToUndefined)
  @IsDateString()
  @IsOptional()
  amc_starting_date?: string;

  @ApiProperty({ example: '2028-02-14', required: false })
  @Transform(emptyToUndefined)
  @IsDateString()
  @IsOptional()
  amc_closing_date?: string;

  @ApiProperty({ example: 8000, required: false })
  @Transform(emptyToUndefined)
  @IsNumber()
  @Min(0)
  @IsOptional()
  amc_amount?: number;

  @ApiProperty({ example: 'AMC Without spare', required: false })
  @Transform(emptyToUndefined)
  @IsString()
  @IsOptional()
  amc_particular?: string;

  @ApiProperty({ example: 'AMC Without spare', required: false })
  @Transform(emptyToUndefined)
  @IsString()
  @IsOptional()
  amc_particulars?: string;
}

