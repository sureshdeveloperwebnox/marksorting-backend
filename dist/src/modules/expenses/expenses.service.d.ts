import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { S3Service } from '../../shared/services/s3.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { CreateMobileExpenseDto } from './dto/create-mobile-expense.dto';
import { UpdateMobileExpenseDto } from './dto/update-mobile-expense.dto';
export declare class ExpensesService {
    private prisma;
    private redis;
    private eventEmitter;
    private s3Service;
    private readonly CACHE_PREFIX;
    private readonly LIST_CACHE_KEY;
    constructor(prisma: PrismaService, redis: RedisService, eventEmitter: EventEmitter2, s3Service: S3Service);
    private mapExpenseImageUrls;
    private mapExpensesImageUrls;
    findAll(params: {
        skip?: number;
        take?: number;
        search?: string;
        status?: string;
        dateFrom?: string;
        dateTo?: string;
    }, user?: {
        userId: string;
        role: string;
    }): Promise<any>;
    findById(id: string, user?: {
        userId: string;
        role: string;
    }): Promise<any>;
    create(dto: CreateExpenseDto | CreateMobileExpenseDto, user?: {
        userId: string;
        role: string;
    }): Promise<({
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
    update(id: string, dto: UpdateExpenseDto | UpdateMobileExpenseDto, user?: {
        userId: string;
        role: string;
    }): Promise<{
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
    remove(id: string, user?: {
        userId: string;
        role: string;
    }): Promise<{
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
    private invalidateCache;
}
