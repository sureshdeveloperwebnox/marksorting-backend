import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
export declare class ExpensesController {
    private readonly expensesService;
    constructor(expensesService: ExpensesService);
    findAll(skip?: string, take?: string, search?: string, status?: string, technicianId?: string, dateFrom?: string, dateTo?: string): Promise<any>;
    findOne(id: string): Promise<any>;
    create(dto: CreateExpenseDto): Promise<({
        mill: {
            id: string;
            name: string;
        } | null;
        expenseCategory: {
            id: string;
            name: string;
        };
        technicians: ({
            technician: {
                id: string;
                full_name: string;
            };
        } & {
            expense_id: string;
            technician_id: string;
        })[];
    } & {
        id: string;
        expense_number: string;
        mill_id: string | null;
        place: string | null;
        visit_date: Date;
        visit_time: string;
        expense_category_id: string;
        others: string | null;
        amount: import("@prisma/client/runtime/client").Decimal;
        expense_images: string[];
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
    }) | null>;
    update(id: string, dto: UpdateExpenseDto): Promise<{
        before: any;
        after: {
            mill: {
                id: string;
                name: string;
            } | null;
            expenseCategory: {
                id: string;
                name: string;
            };
            technicians: ({
                technician: {
                    id: string;
                    full_name: string;
                };
            } & {
                expense_id: string;
                technician_id: string;
            })[];
        } & {
            id: string;
            expense_number: string;
            mill_id: string | null;
            place: string | null;
            visit_date: Date;
            visit_time: string;
            expense_category_id: string;
            others: string | null;
            amount: import("@prisma/client/runtime/client").Decimal;
            expense_images: string[];
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
        };
    }>;
    remove(id: string): Promise<{
        mill: {
            id: string;
            name: string;
        } | null;
        expenseCategory: {
            id: string;
            name: string;
        };
        technicians: ({
            technician: {
                id: string;
                full_name: string;
            };
        } & {
            expense_id: string;
            technician_id: string;
        })[];
    } & {
        id: string;
        expense_number: string;
        mill_id: string | null;
        place: string | null;
        visit_date: Date;
        visit_time: string;
        expense_category_id: string;
        others: string | null;
        amount: import("@prisma/client/runtime/client").Decimal;
        expense_images: string[];
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
    }>;
}
