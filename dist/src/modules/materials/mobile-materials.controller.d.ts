import { MaterialsService } from './materials.service';
import { CreateMaterialDto } from './dto/create-material.dto';
export declare class MobileMaterialsController {
    private readonly materialsService;
    constructor(materialsService: MaterialsService);
    findAll(skip?: string, take?: string, search?: string): Promise<any>;
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
}
