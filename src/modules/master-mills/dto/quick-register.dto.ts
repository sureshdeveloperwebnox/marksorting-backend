import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class QuickRegisterDto {
  @ApiProperty({ example: 'Ravi Kumar', required: false })
  @IsString()
  @IsOptional()
  customer_name?: string;

  @ApiProperty({ example: 'c10d2e3f-4a5b-6c7d-8e9f-0a1b2c3d4e5f', required: false })
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
}
