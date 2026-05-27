import { PartialType } from '@nestjs/swagger';
import { CreateMobileExpenseDto } from './create-mobile-expense.dto';

export class UpdateMobileExpenseDto extends PartialType(
  CreateMobileExpenseDto,
) {}
