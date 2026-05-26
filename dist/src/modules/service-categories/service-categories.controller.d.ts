import { ServiceCategoriesService } from './service-categories.service';
import { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import { UpdateServiceCategoryDto } from './dto/update-service-category.dto';
export declare class ServiceCategoriesController {
    private readonly serviceCategoriesService;
    constructor(serviceCategoriesService: ServiceCategoriesService);
    findAll(skip?: string, take?: string, search?: string, status?: string): Promise<any>;
    findOne(id: string): Promise<any>;
    create(dto: CreateServiceCategoryDto): Promise<{
        description: string | null;
        name: string;
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        status: string;
    }>;
    update(id: string, dto: UpdateServiceCategoryDto): Promise<{
        description: string | null;
        name: string;
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        status: string;
    }>;
    remove(id: string): Promise<{
        description: string | null;
        name: string;
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        status: string;
    }>;
}
