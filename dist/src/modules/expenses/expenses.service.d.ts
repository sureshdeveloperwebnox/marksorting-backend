import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
export declare class ExpensesService {
    private prisma;
    private redis;
    private readonly CACHE_PREFIX;
    private readonly LIST_CACHE_KEY;
    constructor(prisma: PrismaService, redis: RedisService);
    findAll(params: {
        skip?: number;
        take?: number;
        search?: string;
        status?: string;
        dateFrom?: string;
        dateTo?: string;
    }): Promise<any>;
    findById(id: string): Promise<any>;
    create(dto: CreateExpenseDto): Promise<({
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
        expense_category_id: string;
        others: string | null;
        amount: import("@prisma/client/runtime/client").Decimal;
        expense_images: string[];
        expense_number: string;
    }) | null>;
    update(id: string, dto: UpdateExpenseDto): Promise<{
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
        expense_category_id: string;
        others: string | null;
        amount: import("@prisma/client/runtime/client").Decimal;
        expense_images: string[];
        expense_number: string;
    }>;
    remove(id: string): Promise<{
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
        expense_category_id: string;
        others: string | null;
        amount: import("@prisma/client/runtime/client").Decimal;
        expense_images: string[];
        expense_number: string;
    }>;
    private invalidateCache;
}
