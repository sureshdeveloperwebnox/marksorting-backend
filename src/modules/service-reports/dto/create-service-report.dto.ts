import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateServiceReportDto {
  // ── Required fields ──────────────────────────────────────────────────────────

  @ApiProperty({ example: 'uuid-of-service-category' })
  @IsUUID()
  service_category_id: string;

  @ApiProperty({
    example: ['uuid-of-technician-1', 'uuid-of-technician-2'],
    type: [String],
  })
  @IsArray()
  @IsUUID('all', { each: true })
  @ArrayMinSize(1)
  technician_ids: string[];

  @ApiProperty({ example: 'uuid-of-customer', required: false })
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

  @ApiProperty({ example: '+919876543210' })
  @IsString()
  @IsNotEmpty()
  mill_whatsapp_number: string;

  @ApiProperty({ example: '2024-06-15' })
  @IsDateString()
  visit_date: string;

  @ApiProperty({ example: '10:30' })
  @IsString()
  @IsNotEmpty()
  visit_time: string;

  @ApiProperty({ example: '2024-06-10' })
  @IsDateString()
  call_registered_date: string;

  @ApiProperty({ example: 'MarkSort Pro 500' })
  @IsString()
  @IsNotEmpty()
  machine_model: string;

  @ApiProperty({ example: 'SN-2024-00123' })
  @IsString()
  @IsNotEmpty()
  serial_or_frame_no: string;

  @ApiProperty({ example: 'Rajesh Kumar' })
  @IsString()
  @IsNotEmpty()
  authorized_person: string;

  @ApiProperty({ example: 'Machine not sorting correctly at high speed' })
  @IsString()
  @IsNotEmpty()
  nature_of_complaint: string;

  @ApiProperty({
    example: 'Cleaned sensors and recalibrated sorting thresholds',
  })
  @IsString()
  @IsNotEmpty()
  action_taken: string;

  @ApiProperty({ example: 'Machine is now operating within normal parameters' })
  @IsString()
  @IsNotEmpty()
  engineer_remarks: string;

  @ApiProperty({ example: 'data:image/png;base64,...' })
  @IsString()
  @IsNotEmpty()
  engineer_signature: string;

  @ApiProperty({ example: 'data:image/png;base64,...' })
  @IsString()
  @IsNotEmpty()
  customer_signature: string;

  // ── Optional fields ───────────────────────────────────────────────────────────

  @ApiProperty({ example: 'mill@example.com', required: false })
  @IsString()
  @IsOptional()
  mill_email?: string;

  @ApiProperty({ example: '2020-03-01', required: false })
  @IsDateString()
  @IsOptional()
  machine_mfg_date?: string;

  @ApiProperty({ example: '2020-06-15', required: false })
  @IsDateString()
  @IsOptional()
  machine_installation_date?: string;

  @ApiProperty({ example: 'Suresh Babu', required: false })
  @IsString()
  @IsOptional()
  previous_visit_engineer?: string;

  @ApiProperty({
    example: 'Vibration noise from sorting chamber',
    required: false,
  })
  @IsString()
  @IsOptional()
  problem_observed?: string;

  @ApiProperty({ example: 'Rice', required: false })
  @IsString()
  @IsOptional()
  commodity?: string;

  @ApiProperty({ example: '2%', required: false })
  @IsString()
  @IsOptional()
  contamination?: string;

  @ApiProperty({ example: '500 kg/hr', required: false })
  @IsString()
  @IsOptional()
  output_capacity_per_hour?: string;

  @ApiProperty({ example: '0.5%', required: false })
  @IsString()
  @IsOptional()
  rejection_ratio?: string;

  @ApiProperty({ example: '99.5%', required: false })
  @IsString()
  @IsOptional()
  purity?: string;

  @ApiProperty({ example: 5 })
  @Transform(({ value }) => {
    if (typeof value === 'string' && value.trim() !== '') {
      return parseInt(value, 10);
    }
    return value;
  })
  @IsInt()
  @Min(0)
  @IsNotEmpty()
  no_of_programs_set: number;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  ac_provided?: boolean;

  @ApiProperty({ example: 'Atlas Copco GA11, 11 kW', required: false })
  @IsString()
  @IsOptional()
  compressor_details?: string;

  @ApiProperty({ example: 'Refrigerated type, working fine', required: false })
  @IsString()
  @IsOptional()
  air_drier_details?: string;

  @ApiProperty({ example: 'Clean', required: false })
  @IsString()
  @IsOptional()
  line_filter_condition?: string;

  @ApiProperty({ example: 'Needs replacement', required: false })
  @IsString()
  @IsOptional()
  machine_filter_condition?: string;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  auto_drain_valve_working?: boolean;

  @ApiProperty({ example: 'Satisfied with the service', required: false })
  @IsString()
  @IsOptional()
  customer_remarks?: string;

  @ApiProperty({
    example: 'PENDING',
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    required: false,
  })
  @IsIn(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
  @IsOptional()
  status?: string;
}
