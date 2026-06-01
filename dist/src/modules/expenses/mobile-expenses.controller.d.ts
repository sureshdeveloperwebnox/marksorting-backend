import { ExpensesService } from './expenses.service';
import { CreateMobileExpenseDto } from './dto/create-mobile-expense.dto';
import { UpdateMobileExpenseDto } from './dto/update-mobile-expense.dto';
export declare class MobileExpensesController {
    private readonly expensesService;
    constructor(expensesService: ExpensesService);
    findAll(req: any, skip?: string, take?: string, search?: string, status?: string, dateFrom?: string, dateTo?: string): Promise<any>;
    findOne(id: string, req: any): Promise<any>;
    create(dto: CreateMobileExpenseDto, req: any): Promise<({
        mill: {
            id: string;
            name: string;
        } | null;
        technicians: ({
            technician: {
                id: string;
                full_name: string;
            };
        } & {
            technician_id: string;
            expense_id: string;
        })[];
        expenseCategory: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        status: string;
        mill_id: string | null;
        place: string | null;
        visit_date: Date;
        visit_time: string;
        expense_number: string;
        expense_category_id: string;
        others: string | null;
        amount: import("@prisma/client/runtime/client").Decimal;
        expense_images: string[];
    }) | null>;
    update(id: string, dto: UpdateMobileExpenseDto, req: any): Promise<{
        before: any;
        after: {
            mill: {
                id: string;
                name: string;
            } | null;
            technicians: ({
                technician: {
                    id: string;
                    full_name: string;
                };
            } & {
                technician_id: string;
                expense_id: string;
            })[];
            expenseCategory: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            status: string;
            mill_id: string | null;
            place: string | null;
            visit_date: Date;
            visit_time: string;
            expense_number: string;
            expense_category_id: string;
            others: string | null;
            amount: import("@prisma/client/runtime/client").Decimal;
            expense_images: string[];
        };
    }>;
    remove(id: string, req: any): Promise<{
        mill: {
            id: string;
            name: string;
        } | null;
        technicians: ({
            technician: {
                id: string;
                full_name: string;
            };
        } & {
            technician_id: string;
            expense_id: string;
        })[];
        expenseCategory: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        status: string;
        mill_id: string | null;
        place: string | null;
        visit_date: Date;
        visit_time: string;
        expense_number: string;
        expense_category_id: string;
        others: string | null;
        amount: import("@prisma/client/runtime/client").Decimal;
        expense_images: string[];
    }>;
}
