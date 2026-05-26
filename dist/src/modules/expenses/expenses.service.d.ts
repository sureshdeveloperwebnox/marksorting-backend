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
            name: string;
            id: string;
        } | null;
        expenseCategory: {
            name: string;
            id: string;
        };
        technicians: ({
            technician: {
                full_name: string;
                id: string;
            };
        } & {
            technician_id: string;
            expense_id: string;
        })[];
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
            name: string;
            id: string;
        } | null;
        expenseCategory: {
            name: string;
            id: string;
        };
        technicians: ({
            technician: {
                full_name: string;
                id: string;
            };
        } & {
            technician_id: string;
            expense_id: string;
        })[];
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
            name: string;
            id: string;
        } | null;
        expenseCategory: {
            name: string;
            id: string;
        };
        technicians: ({
            technician: {
                full_name: string;
                id: string;
            };
        } & {
            technician_id: string;
            expense_id: string;
        })[];
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
