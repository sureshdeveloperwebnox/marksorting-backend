import { MillsService } from './mills.service';
import { CreateMillDto } from './dto/create-mill.dto';
import { UpdateMillDto } from './dto/update-mill.dto';
export declare class MillsController {
    private readonly millsService;
    constructor(millsService: MillsService);
    findAll(skip?: string, take?: string, search?: string, status?: string): Promise<any>;
    findOne(id: string): Promise<any>;
    create(dto: CreateMillDto): Promise<{
        id: string;
        name: string;
        created_at: Date;
        updated_at: Date;
        email: string | null;
        deleted_at: Date | null;
        status: string;
        phone: string | null;
        address: string | null;
    }>;
    update(id: string, dto: UpdateMillDto): Promise<{
        id: string;
        name: string;
        created_at: Date;
        updated_at: Date;
        email: string | null;
        deleted_at: Date | null;
        status: string;
        phone: string | null;
        address: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        created_at: Date;
        updated_at: Date;
        email: string | null;
        deleted_at: Date | null;
        status: string;
        phone: string | null;
        address: string | null;
    }>;
}
