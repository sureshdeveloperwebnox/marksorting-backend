import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
export declare class ExpensesController {
    private readonly expensesService;
    constructor(expensesService: ExpensesService);
    findAll(skip?: string, take?: string, search?: string, status?: string, technicianId?: string, dateFrom?: string, dateTo?: string, createdDateFrom?: string, createdDateTo?: string, expenseDateFrom?: string, expenseDateTo?: string, req?: any): Promise<any>;
    checkEligibility(technicianId?: string, excludeExpenseId?: string): Promise<{
        eligible: boolean;
        serviceReports: any;
        installationReports: any;
    }>;
    findOne(id: string): Promise<any>;
    create(dto: CreateExpenseDto): Promise<any>;
    update(id: string, dto: UpdateExpenseDto): Promise<{
        before: any;
        after: any;
    }>;
    remove(id: string): Promise<any>;
}
