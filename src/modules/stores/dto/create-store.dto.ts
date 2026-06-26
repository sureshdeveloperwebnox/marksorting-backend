import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStoreDto {
  @ApiProperty({ example: 'uuid-of-service-engineer' })
  @IsUUID()
  @IsNotEmpty()
  service_engineer_id: string;

  @ApiProperty({ example: 'uuid-of-customer' })
  @IsUUID()
  @IsNotEmpty()
  customer_id: string;

  @ApiProperty({ example: ['uuid-of-material-1', 'uuid-of-material-2'] })
  @IsArray()
  @IsUUID(undefined, { each: true })
  @ArrayMinSize(1)
  material_ids: string[];

  @ApiProperty({
    example: [{ material_id: 'uuid-of-material-1', quantity: 2 }],
    required: false,
  })
  @IsArray()
  @IsOptional()
  material_quantities?: { material_id: string; quantity: number }[];

  @ApiProperty({ example: 5 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 'Non Warranty' })
  @IsString()
  @IsNotEmpty()
  warranty_status: string;

  @ApiProperty({ example: 'FRM10245' })
  @IsString()
  @IsNotEmpty()
  frame_number: string;

  @ApiProperty({ example: 'Pending' })
  @IsString()
  @IsNotEmpty()
  return_status: string;

  @ApiProperty({ example: 'Inflow' })
  @IsString()
  @IsNotEmpty()
  inflow_status: string;

  @ApiProperty({ example: 'BAR1234567', required: false })
  @IsString()
  @IsOptional()
  barcode?: string;

  @ApiProperty({ example: 'DHL', required: false })
  @IsString()
  @IsOptional()
  provider_name?: string;

  @ApiProperty({ example: 'INV-12345', required: false })
  @IsString()
  @IsOptional()
  invoice_number?: string;

  @ApiProperty({
    example: 'Some remarks about the store record',
    required: false,
  })
  @IsString()
  @IsOptional()
  remarks?: string;
}
