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
        email: string | null;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        name: string;
        phone: string | null;
        status: string;
        address: string | null;
        customer_id: string | null;
    }>;
    update(id: string, dto: UpdateMillDto): Promise<{
        id: string;
        email: string | null;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        name: string;
        phone: string | null;
        status: string;
        address: string | null;
        customer_id: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        email: string | null;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        name: string;
        phone: string | null;
        status: string;
        address: string | null;
        customer_id: string | null;
    }>;
}
