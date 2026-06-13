import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMillDto {
  @ApiProperty({ example: 'uuid-of-customer', required: false })
  @IsUUID()
  @IsOptional()
  customer_id?: string;

  @ApiProperty({ example: 'Golden Valley Mill' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'REF-001', required: false })
  @IsString()
  @IsOptional()
  ref_no?: string;

  @ApiProperty({ example: 'contact@goldenvalley.com', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsString()
  @IsOptional()
  phone_2?: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsString()
  @IsOptional()
  phone_3?: string;

  @ApiProperty({ example: '123 Mill Lane, Valley View', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: 'Kurud', required: false })
  @IsString()
  @IsOptional()
  place?: string;

  @ApiProperty({ example: 'Dhamtari', required: false })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ example: 'ACTIVE', required: false })
  @IsString()
  @IsOptional()
  status?: string;
}
