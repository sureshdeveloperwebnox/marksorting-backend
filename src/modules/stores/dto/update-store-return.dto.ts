import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateStoreReturnDto {
  @ApiProperty({
    example: 'Express Logistics',
    description: 'Name of the provider/courier',
  })
  @IsString()
  @IsNotEmpty()
  provider_name: string;

  @ApiProperty({
    example: 'INV-987654',
    description: 'Return shipment invoice number',
  })
  @IsString()
  @IsNotEmpty()
  invoice_number: string;
}
