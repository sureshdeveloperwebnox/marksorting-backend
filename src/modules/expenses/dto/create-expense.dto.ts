import {
  IsArray,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateExpenseItemDto {
  @ApiProperty({
    example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    description: 'UUID of the expense category.',
  })
  @IsUUID()
  @IsNotEmpty()
  expense_category_id: string;

  @ApiProperty({
    example: 1500,
    minimum: 0,
    description: 'Amount for this category.',
  })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({
    example: 1500,
    minimum: 0,
    required: false,
    description: 'Admin approved amount for this category.',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  admin_amount?: number;

  @ApiProperty({
    example: 'Details for this category',
    required: false,
    description: 'Remarks of the category expense.',
  })
  @IsString()
  @IsOptional()
  remarks?: string;

  @ApiProperty({
    example: 'Admin remarks for this category',
    required: false,
    description: 'Remarks of the admin for this category expense.',
  })
  @IsString()
  @IsOptional()
  admin_remarks?: string;

  @ApiProperty({
    example: ['receipts/2026/05/receipt-001.jpg'],
    type: [String],
    required: false,
    description: 'Array of S3 object keys for uploaded receipt images.',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  expense_images?: string[];
}

export class CreateExpenseDto {
  @ApiProperty({
    example: 'MILL',
    enum: ['MILL', 'OTHERS'],
    required: false,
    description: 'Expense type: MILL or OTHERS',
  })
  @IsIn(['MILL', 'OTHERS'])
  @IsOptional()
  expense_type?: string;

  @ApiProperty({
    example: ['xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'],
    type: [String],
    required: false,
    description:
      'List of technician UUIDs assigned to this expense. ' +
      "On the mobile endpoint a Service Engineer's own ID is automatically appended, " +
      'so this field may be omitted from the mobile request body.',
  })
  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  technician_ids?: string[];

  @ApiProperty({
    example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    required: false,
    description:
      'UUID of the customer associated with this expense (optional). Used for client payload compatibility and stripped before DB insert.',
  })
  @IsUUID()
  @IsOptional()
  customer_id?: string;

  @ApiProperty({
    example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    required: false,
    description: 'UUID of the mill associated with this expense (optional).',
  })
  @IsUUID()
  @IsOptional()
  mill_id?: string;

  @ApiProperty({
    example: 'Coimbatore',
    required: false,
    description:
      "Free-text location where the expense was incurred. Auto-populated from the selected mill's address if available.",
  })
  @IsString()
  @IsOptional()
  place?: string;

  @ApiProperty({
    example: '2026-05-26',
    description:
      'Date of the site visit — ISO 8601 date string (YYYY-MM-DD). Required if no report is linked, optional if a report is linked.',
  })
  @IsDateString()
  @IsOptional()
  visit_date?: string;

  @ApiProperty({
    example: '10:30',
    description:
      'Time of the site visit in HH:MM 24-hour format. **Optional.**',
    required: false,
  })
  @IsString()
  @IsOptional()
  visit_time?: string;

  @ApiProperty({
    example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    required: false,
    description:
      'UUID of the expense category (e.g. Travel, Food, Accommodation). Optional if expense_items is provided.',
  })
  @IsUUID()
  @IsOptional()
  expense_category_id?: string;

  @ApiProperty({
    type: [CreateExpenseItemDto],
    required: false,
    description: 'Breakdown of expense items for multi-category selection.',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateExpenseItemDto)
  @IsOptional()
  expense_items?: CreateExpenseItemDto[];

  @ApiProperty({
    example: 'Taxi from railway station to mill site',
    required: false,
    description:
      'Additional remarks or description about the expense (e.g. vendor name, hotel details).',
  })
  @IsString()
  @IsOptional()
  others?: string;

  @ApiProperty({
    example: 'Detailed remarks of the expense',
    required: false,
    description: 'Detailed remarks of the expense',
  })
  @IsString()
  @IsOptional()
  remarks?: string;

  @ApiProperty({
    example: 1500,
    required: false,
    minimum: 0,
    description:
      'Expense amount in INR (₹). Defaults to `0` if omitted. Must be ≥ 0.',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number;

  @ApiProperty({
    example: 1500,
    required: false,
    minimum: 0,
    description: 'Admin approved expense amount in INR (₹).',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  admin_amount?: number;

  @ApiProperty({
    example: ['receipts/2026/05/receipt-001.jpg'],
    type: [String],
    required: false,
    description:
      'Array of S3/storage object keys for uploaded receipt images. ' +
      'Use the file-upload endpoint to obtain object keys before submitting.',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  expense_images?: string[];

  @ApiProperty({
    example: 'PENDING',
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    required: false,
    description:
      'Expense workflow status. Defaults to `PENDING` on creation.\n\n' +
      '| Value | Meaning |\n' +
      '|---|---|\n' +
      '| `PENDING` | Submitted, awaiting review |\n' +
      '| `IN_PROGRESS` | Under review / partially processed |\n' +
      '| `COMPLETED` | Approved and settled |\n' +
      '| `CANCELLED` | Cancelled before settlement |',
  })
  @IsIn(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
  @IsOptional()
  status?: string;

  @ApiProperty({
    example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    required: false,
    description: 'UUID of the linked Service Report (optional).',
  })
  @IsUUID()
  @IsOptional()
  service_report_id?: string;

  @ApiProperty({
    example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    required: false,
    description: 'UUID of the linked Installation Report (optional).',
  })
  @IsUUID()
  @IsOptional()
  installation_report_id?: string;
}
