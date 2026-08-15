import { IsOptional, IsString, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateStoreReturnDto {
  @ApiPropertyOptional({
    example: 'DHL Express',
    description: 'Name of the provider/courier',
  })
  @IsString()
  @IsOptional()
  provider_name?: string;

  @ApiPropertyOptional({
    example: 'INV-987654',
    description: 'Return shipment invoice / tracking number',
  })
  @IsString()
  @IsOptional()
  invoice_number?: string;

  @ApiPropertyOptional({
    example: '(Serial Nos: MAIN BOARD: [BAR-001 (USED)])',
    description: 'Remarks and serial number breakdown',
  })
  @IsString()
  @IsOptional()
  remarks?: string;

  @ApiPropertyOptional({
    example: 'Returned',
    description: 'Return status (e.g. Returned, Completed, In Progress)',
  })
  @IsString()
  @IsOptional()
  return_status?: string;

  @ApiPropertyOptional({
    description: 'Courier photos list',
  })
  @IsArray()
  @IsOptional()
  courier_photos?: any[];

  @ApiPropertyOptional({
    description: 'Products / barcode remarks details list',
  })
  @IsArray()
  @IsOptional()
  products?: any[];
}

