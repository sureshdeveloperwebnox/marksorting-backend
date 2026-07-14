import { MaterialsService } from './materials.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
export declare class MaterialsController {
    private readonly materialsService;
    constructor(materialsService: MaterialsService);
    findAll(skip?: string, take?: string, search?: string, status?: string): Promise<any>;
    findOne(id: string): Promise<any>;
    create(dto: CreateMaterialDto): Promise<{
        id: string;
        name: string;
        description: string | null;
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
    }>;
    update(id: string, dto: UpdateMaterialDto): Promise<{
        before: {
            id: string;
            name: string;
            description: string | null;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
        };
        after: {
            id: string;
            name: string;
            description: string | null;
            status: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
        };
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
    }>;
}
