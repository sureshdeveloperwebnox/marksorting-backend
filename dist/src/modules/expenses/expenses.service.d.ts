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
    private readonly logger;
    constructor(prisma: PrismaService, redis: RedisService, eventEmitter: EventEmitter2, s3Service: S3Service);
    private mapExpenseImageUrls;
    private mapExpensesImageUrls;
    findAll(params: {
        skip?: number;
        take?: number;
        search?: string;
        status?: string;
        technicianId?: string;
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
        technicians: ({
            technician: {
                id: string;
                full_name: string;
            };
        } & {
            expense_id: string;
            technician_id: string;
        })[];
        expenseCategory: {
            id: string;
            name: string;
        } | null;
        mill: {
            id: string;
            name: string;
            customer: {
                id: string;
                name: string;
            } | null;
        } | null;
        expense_items: ({
            expenseCategory: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            expense_category_id: string;
            remarks: string | null;
            amount: import("@prisma/client/runtime/client").Decimal;
            admin_amount: import("@prisma/client/runtime/client").Decimal;
            expense_images: string[];
            created_at: Date;
            updated_at: Date;
            expense_id: string;
        })[];
        serviceReport: {
            id: string;
            report_number: string;
        } | null;
        installationReport: {
            id: string;
            report_number: string;
        } | null;
    } & {
        id: string;
        expense_number: string;
        expense_type: string;
        report_type: string;
        mill_id: string | null;
        place: string | null;
        visit_date: Date;
        visit_time: string;
        expense_category_id: string | null;
        others: string | null;
        remarks: string | null;
        amount: import("@prisma/client/runtime/client").Decimal;
        admin_amount: import("@prisma/client/runtime/client").Decimal;
        expense_images: string[];
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        service_report_id: string | null;
        installation_report_id: string | null;
    }) | null>;
    update(id: string, dto: UpdateExpenseDto | UpdateMobileExpenseDto, user?: {
        userId: string;
        role: string;
    }): Promise<{
        before: any;
        after: ({
            technicians: ({
                technician: {
                    id: string;
                    full_name: string;
                };
            } & {
                expense_id: string;
                technician_id: string;
            })[];
            expenseCategory: {
                id: string;
                name: string;
            } | null;
            mill: {
                id: string;
                name: string;
                customer: {
                    id: string;
                    name: string;
                } | null;
            } | null;
            expense_items: ({
                expenseCategory: {
                    id: string;
                    name: string;
                };
            } & {
                id: string;
                expense_category_id: string;
                remarks: string | null;
                amount: import("@prisma/client/runtime/client").Decimal;
                admin_amount: import("@prisma/client/runtime/client").Decimal;
                expense_images: string[];
                created_at: Date;
                updated_at: Date;
                expense_id: string;
            })[];
            serviceReport: {
                id: string;
                report_number: string;
            } | null;
            installationReport: {
                id: string;
                report_number: string;
            } | null;
        } & {
            id: string;
            expense_number: string;
            expense_type: string;
            report_type: string;
            mill_id: string | null;
            place: string | null;
            visit_date: Date;
            visit_time: string;
            expense_category_id: string | null;
            others: string | null;
            remarks: string | null;
            amount: import("@prisma/client/runtime/client").Decimal;
            admin_amount: import("@prisma/client/runtime/client").Decimal;
            expense_images: string[];
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            service_report_id: string | null;
            installation_report_id: string | null;
        }) | null;
    }>;
    remove(id: string, user?: {
        userId: string;
        role: string;
    }): Promise<{
        technicians: ({
            technician: {
                id: string;
                full_name: string;
            };
        } & {
            expense_id: string;
            technician_id: string;
        })[];
        expenseCategory: {
            id: string;
            name: string;
        } | null;
        mill: {
            id: string;
            name: string;
            customer: {
                id: string;
                name: string;
            } | null;
        } | null;
        expense_items: ({
            expenseCategory: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            expense_category_id: string;
            remarks: string | null;
            amount: import("@prisma/client/runtime/client").Decimal;
            admin_amount: import("@prisma/client/runtime/client").Decimal;
            expense_images: string[];
            created_at: Date;
            updated_at: Date;
            expense_id: string;
        })[];
        serviceReport: {
            id: string;
            report_number: string;
        } | null;
        installationReport: {
            id: string;
            report_number: string;
        } | null;
    } & {
        id: string;
        expense_number: string;
        expense_type: string;
        report_type: string;
        mill_id: string | null;
        place: string | null;
        visit_date: Date;
        visit_time: string;
        expense_category_id: string | null;
        others: string | null;
        remarks: string | null;
        amount: import("@prisma/client/runtime/client").Decimal;
        admin_amount: import("@prisma/client/runtime/client").Decimal;
        expense_images: string[];
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        service_report_id: string | null;
        installation_report_id: string | null;
    }>;
    checkEligibility(user: {
        userId: string;
        role: string;
    }, technicianId?: string, excludeExpenseId?: string): Promise<{
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
    private invalidateCache;
}
