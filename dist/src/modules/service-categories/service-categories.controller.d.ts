import { ServiceCategoriesService } from './service-categories.service';
import { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import { UpdateServiceCategoryDto } from './dto/update-service-category.dto';
export declare class ServiceCategoriesController {
    private readonly serviceCategoriesService;
    constructor(serviceCategoriesService: ServiceCategoriesService);
    findAll(skip?: string, take?: string, search?: string, status?: string): Promise<any>;
    findOne(id: string): Promise<any>;
    create(dto: CreateServiceCategoryDto): Promise<{
        id: string;
        description: string | null;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        name: string;
        status: string;
    }>;
    update(id: string, dto: UpdateServiceCategoryDto): Promise<{
        before: any;
        after: {
            id: string;
            description: string | null;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            name: string;
            status: string;
        };
    }>;
    remove(id: string): Promise<{
        id: string;
        description: string | null;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        name: string;
        status: string;
    }>;
}
