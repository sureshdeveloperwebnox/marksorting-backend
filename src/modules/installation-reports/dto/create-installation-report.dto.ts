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
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty({ example: '2026-05-23' })
  @IsDateString()
  visit_date: string;

  @ApiProperty({ example: '10:30' })
  @IsString()
  @IsNotEmpty()
  visit_time: string;

  @ApiProperty({ example: '2026-05-20' })
  @IsDateString()
  call_registered_date: string;

  @ApiProperty({ example: 'MarkSort Pro 500' })
  @IsString()
  @IsNotEmpty()
  machine_model: string;

  @ApiProperty({ example: 'SN-2026-00123' })
  @IsString()
  @IsNotEmpty()
  serial_or_frame_no: string;

  @ApiProperty({ example: 'Rajesh Kumar' })
  @IsString()
  @IsNotEmpty()
  authorized_person: string;

  @ApiProperty({ example: 'IR-INV-100234', required: false })
  @IsString()
  @IsOptional()
  invoice_number?: string;

  @ApiProperty({ example: '2026-05-15', required: false })
  @IsDateString()
  @IsOptional()
  invoice_date?: string;

  @ApiProperty({ example: '2026-05-23', required: false })
  @IsDateString()
  @IsOptional()
  warranty_start_date?: string;

  @ApiProperty({ example: '2027-05-23', required: false })
  @IsDateString()
  @IsOptional()
  warranty_end_date?: string;

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

  @ApiProperty({ example: 5, required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  no_of_programs_set?: number;

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

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  ground_earth_provided?: boolean;

  @ApiProperty({ example: 5, required: false })
  @IsInt()
  @Min(1)
  @Max(12)
  @IsOptional()
  ground_earth_value?: number;

  @ApiProperty({
    example: 'PRIMARY',
    enum: ['PRIMARY', 'SECONDARY', 'REJECTION_1', 'REJECTION_2', 'SPLIT'],
    required: false,
  })
  @IsIn(['PRIMARY', 'SECONDARY', 'REJECTION_1', 'REJECTION_2', 'SPLIT'])
  @IsOptional()
  ground_earth_field?: string;

  @ApiProperty({ example: 3, required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  no_of_filters_installed?: number;

  @ApiProperty({ example: 'Good', required: false })
  @IsString()
  @IsOptional()
  oil_filter_condition?: string;

  @ApiProperty({ example: 'Clean', required: false })
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

  @ApiProperty({ example: 'data:image/png;base64,...' })
  @IsString()
  @IsNotEmpty()
  customer_signature: string;

  @ApiProperty({ example: 'mill@example.com', required: false })
  @IsString()
  @IsOptional()
  mill_email?: string;

  @ApiProperty({ example: 'Satisfied with the installation', required: false })
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
