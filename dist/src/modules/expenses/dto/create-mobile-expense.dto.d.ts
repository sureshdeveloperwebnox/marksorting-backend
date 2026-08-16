import { CreateExpenseDto } from './create-expense.dto';
declare const CreateMobileExpenseDto_base: import("@nestjs/common").Type<Omit<CreateExpenseDto, "technician_ids">>;
export declare class CreateMobileExpenseDto extends CreateMobileExpenseDto_base {
    technician_id?: string;
    technician_ids?: string[];
}
export {};
