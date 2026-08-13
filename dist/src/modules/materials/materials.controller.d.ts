import { MaterialsService } from './materials.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
export declare class MaterialsController {
    private readonly materialsService;
    constructor(materialsService: MaterialsService);
    findAll(skip?: string, take?: string, search?: string, status?: string): Promise<any>;
    findOne(id: string): Promise<any>;
    create(dto: CreateMaterialDto): Promise<{
        description: string | null;
        status: string;
        id: string;
        name: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        uom: string | null;
    }>;
    update(id: string, dto: UpdateMaterialDto): Promise<{
        before: {
            description: string | null;
            status: string;
            id: string;
            name: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            uom: string | null;
        };
        after: {
            description: string | null;
            status: string;
            id: string;
            name: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            uom: string | null;
        };
    }>;
    remove(id: string): Promise<{
        description: string | null;
        status: string;
        id: string;
        name: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        uom: string | null;
    }>;
}
