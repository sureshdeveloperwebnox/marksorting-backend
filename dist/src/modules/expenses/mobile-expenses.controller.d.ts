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
        serviceReport: {
            id: string;
            report_number: string;
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
        mill: {
            id: string;
            name: string;
            customer: {
                id: string;
                name: string;
            } | null;
        } | null;
        installationReport: {
            id: string;
            report_number: string;
        } | null;
        expenseCategory: {
            id: string;
            name: string;
        } | null;
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
            amount: import("@prisma/client/runtime/client").Decimal;
            expense_category_id: string;
            expense_images: string[];
            admin_amount: import("@prisma/client/runtime/client").Decimal;
            remarks: string | null;
            admin_remarks: string | null;
        })[];
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        mill_id: string | null;
        place: string | null;
        visit_date: Date;
        visit_time: string;
        status: string;
        amount: import("@prisma/client/runtime/client").Decimal;
        expense_category_id: string | null;
        others: string | null;
        expense_images: string[];
        service_report_id: string | null;
        installation_report_id: string | null;
        admin_amount: import("@prisma/client/runtime/client").Decimal;
        remarks: string | null;
        expense_type: string;
        expense_number: string;
        report_type: string;
    }) | null>;
    update(id: string, dto: UpdateMobileExpenseDto, req: any): Promise<{
        before: any;
        after: ({
            serviceReport: {
                id: string;
                report_number: string;
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
            mill: {
                id: string;
                name: string;
                customer: {
                    id: string;
                    name: string;
                } | null;
            } | null;
            installationReport: {
                id: string;
                report_number: string;
            } | null;
            expenseCategory: {
                id: string;
                name: string;
            } | null;
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
                amount: import("@prisma/client/runtime/client").Decimal;
                expense_category_id: string;
                expense_images: string[];
                admin_amount: import("@prisma/client/runtime/client").Decimal;
                remarks: string | null;
                admin_remarks: string | null;
            })[];
        } & {
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            mill_id: string | null;
            place: string | null;
            visit_date: Date;
            visit_time: string;
            status: string;
            amount: import("@prisma/client/runtime/client").Decimal;
            expense_category_id: string | null;
            others: string | null;
            expense_images: string[];
            service_report_id: string | null;
            installation_report_id: string | null;
            admin_amount: import("@prisma/client/runtime/client").Decimal;
            remarks: string | null;
            expense_type: string;
            expense_number: string;
            report_type: string;
        }) | null;
    }>;
    remove(id: string, req: any): Promise<{
        serviceReport: {
            id: string;
            report_number: string;
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
        mill: {
            id: string;
            name: string;
            customer: {
                id: string;
                name: string;
            } | null;
        } | null;
        installationReport: {
            id: string;
            report_number: string;
        } | null;
        expenseCategory: {
            id: string;
            name: string;
        } | null;
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
            amount: import("@prisma/client/runtime/client").Decimal;
            expense_category_id: string;
            expense_images: string[];
            admin_amount: import("@prisma/client/runtime/client").Decimal;
            remarks: string | null;
            admin_remarks: string | null;
        })[];
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        mill_id: string | null;
        place: string | null;
        visit_date: Date;
        visit_time: string;
        status: string;
        amount: import("@prisma/client/runtime/client").Decimal;
        expense_category_id: string | null;
        others: string | null;
        expense_images: string[];
        service_report_id: string | null;
        installation_report_id: string | null;
        admin_amount: import("@prisma/client/runtime/client").Decimal;
        remarks: string | null;
        expense_type: string;
        expense_number: string;
        report_type: string;
    }>;
}
