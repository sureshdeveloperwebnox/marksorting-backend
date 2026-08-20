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
    example: '(Serial Nos: MAIN BOARD: [BAR-001 (USED:Returned, ENG_ACK:Acknowledged), BAR-002] | Service Type: Replacement)',
    description: 'Remarks and serial number breakdown with used, return, and acknowledge status tags',
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
    example: [
      {
        material_id: 'uuid-of-material',
        material_name: 'Screw',
        barcodes: [
          {
            barcode: '59681654',
            used: true,
            return_status: 'Returned',
            acknowledge_status: 'Acknowledged',
          },
          {
            barcode: '59681655',
            used: false,
          },
        ],
      },
    ],
    description:
      'Products list with per-barcode Used toggle, conditional Return Status (Returned / Not Returned for used units), and Engineer Acknowledge Status (Acknowledged / Pending for used units)',
  })
  @IsArray()
  @IsOptional()
  products?: any[];
}


