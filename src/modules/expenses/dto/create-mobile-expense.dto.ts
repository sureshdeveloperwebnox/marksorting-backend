import { OmitType } from '@nestjs/swagger';
import { CreateExpenseDto } from './create-expense.dto';
import { IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMobileExpenseDto extends OmitType(CreateExpenseDto, [
  'technician_ids',
] as const) {
  @ApiProperty({
    example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    required: false,
    description:
      'Single technician UUID assigned to this expense (optional). Used by the mobile client.',
  })
  @IsUUID()
  @IsOptional()
  technician_id?: string;
}
