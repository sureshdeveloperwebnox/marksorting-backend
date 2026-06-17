import { ExpensesService } from './expenses.service';
import { CreateMobileExpenseDto } from './dto/create-mobile-expense.dto';
import { UpdateMobileExpenseDto } from './dto/update-mobile-expense.dto';
export declare class MobileExpensesController {
    private readonly expensesService;
    constructor(expensesService: ExpensesService);
    findAll(req: any, skip?: string, take?: string, search?: string, status?: string, dateFrom?: string, dateTo?: string, startDate?: string, endDate?: string): Promise<any>;
    checkEligibility(req: any, excludeExpenseId?: string): Promise<{
        eligible: boolean;
        serviceReports: {
            id: string;
            report_number: string;
            mill_id: string;
            place: string;
            visit_date: Date;
            mill_name: string;
        }[];
        installationReports: {
            id: string;
            report_number: string;
            mill_id: string;
            place: string;
            visit_date: Date;
            mill_name: string;
        }[];
    }>;
    findOne(id: string, req: any): Promise<any>;
    create(dto: CreateMobileExpenseDto, req: any): Promise<({
        mill: {
            id: string;
            name: string;
            customer: {
                id: string;
                name: string;
            } | null;
        } | null;
        serviceReport: {
            id: string;
            report_number: string;
        } | null;
        installationReport: {
            id: string;
            report_number: string;
        } | null;
        expenseCategory: {
            id: string;
            name: string;
        } | null;
        technicians: ({
            technician: {
                id: string;
                full_name: string;
            };
        } & {
            expense_id: string;
            technician_id: string;
        })[];
        expense_items: ({
            expenseCategory: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            created_at: Date;
            updated_at: Date;
            expense_id: string;
            expense_category_id: string;
            amount: import("@prisma/client/runtime/client").Decimal;
            expense_images: string[];
            remarks: string | null;
            admin_amount: import("@prisma/client/runtime/client").Decimal;
        })[];
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        place: string | null;
        status: string;
        mill_id: string | null;
        visit_date: Date;
        visit_time: string;
        service_report_id: string | null;
        installation_report_id: string | null;
        expense_number: string;
        expense_category_id: string | null;
        others: string | null;
        amount: import("@prisma/client/runtime/client").Decimal;
        expense_images: string[];
        expense_type: string;
        report_type: string;
        remarks: string | null;
        admin_amount: import("@prisma/client/runtime/client").Decimal;
    }) | null>;
    update(id: string, dto: UpdateMobileExpenseDto, req: any): Promise<{
        before: any;
        after: ({
            mill: {
                id: string;
                name: string;
                customer: {
                    id: string;
                    name: string;
                } | null;
            } | null;
            serviceReport: {
                id: string;
                report_number: string;
            } | null;
            installationReport: {
                id: string;
                report_number: string;
            } | null;
            expenseCategory: {
                id: string;
                name: string;
            } | null;
            technicians: ({
                technician: {
                    id: string;
                    full_name: string;
                };
            } & {
                expense_id: string;
                technician_id: string;
            })[];
            expense_items: ({
                expenseCategory: {
                    id: string;
                    name: string;
                };
            } & {
                id: string;
                created_at: Date;
                updated_at: Date;
                expense_id: string;
                expense_category_id: string;
                amount: import("@prisma/client/runtime/client").Decimal;
                expense_images: string[];
                remarks: string | null;
                admin_amount: import("@prisma/client/runtime/client").Decimal;
            })[];
        } & {
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            place: string | null;
            status: string;
            mill_id: string | null;
            visit_date: Date;
            visit_time: string;
            service_report_id: string | null;
            installation_report_id: string | null;
            expense_number: string;
            expense_category_id: string | null;
            others: string | null;
            amount: import("@prisma/client/runtime/client").Decimal;
            expense_images: string[];
            expense_type: string;
            report_type: string;
            remarks: string | null;
            admin_amount: import("@prisma/client/runtime/client").Decimal;
        }) | null;
    }>;
    remove(id: string, req: any): Promise<{
        mill: {
            id: string;
            name: string;
            customer: {
                id: string;
                name: string;
            } | null;
        } | null;
        serviceReport: {
            id: string;
            report_number: string;
        } | null;
        installationReport: {
            id: string;
            report_number: string;
        } | null;
        expenseCategory: {
            id: string;
            name: string;
        } | null;
        technicians: ({
            technician: {
                id: string;
                full_name: string;
            };
        } & {
            expense_id: string;
            technician_id: string;
        })[];
        expense_items: ({
            expenseCategory: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            created_at: Date;
            updated_at: Date;
            expense_id: string;
            expense_category_id: string;
            amount: import("@prisma/client/runtime/client").Decimal;
            expense_images: string[];
            remarks: string | null;
            admin_amount: import("@prisma/client/runtime/client").Decimal;
        })[];
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        place: string | null;
        status: string;
        mill_id: string | null;
        visit_date: Date;
        visit_time: string;
        service_report_id: string | null;
        installation_report_id: string | null;
        expense_number: string;
        expense_category_id: string | null;
        others: string | null;
        amount: import("@prisma/client/runtime/client").Decimal;
        expense_images: string[];
        expense_type: string;
        report_type: string;
        remarks: string | null;
        admin_amount: import("@prisma/client/runtime/client").Decimal;
    }>;
}
