import { ExpenseCategoriesService } from './expense-categories.service';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto';
import { UpdateExpenseCategoryDto } from './dto/update-expense-category.dto';
export declare class ExpenseCategoriesController {
    private readonly expenseCategoriesService;
    constructor(expenseCategoriesService: ExpenseCategoriesService);
    findAll(skip?: string, take?: string, search?: string, status?: string): Promise<any>;
    findOne(id: string): Promise<any>;
    create(dto: CreateExpenseCategoryDto): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        name: string;
        description: string | null;
        status: string;
    }>;
    update(id: string, dto: UpdateExpenseCategoryDto): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        name: string;
        description: string | null;
        status: string;
    }>;
    remove(id: string): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        name: string;
        description: string | null;
        status: string;
    }>;
}
