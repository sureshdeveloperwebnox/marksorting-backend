import { MaterialsService } from './materials.service';
import { CreateMaterialDto } from './dto/create-material.dto';
export declare class MobileMaterialsController {
    private readonly materialsService;
    constructor(materialsService: MaterialsService);
    findAll(skip?: string, take?: string, search?: string): Promise<any>;
    create(dto: CreateMaterialDto): Promise<{
        id: string;
        name: string;
        description: string | null;
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
    }>;
}
