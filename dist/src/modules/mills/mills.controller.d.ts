import { MillsService } from './mills.service';
import { CreateMillDto } from './dto/create-mill.dto';
import { UpdateMillDto } from './dto/update-mill.dto';
export declare class MillsController {
    private readonly millsService;
    constructor(millsService: MillsService);
    findAll(skip?: string, take?: string, search?: string, status?: string, customerId?: string): Promise<any>;
    findOne(id: string): Promise<any>;
    create(dto: CreateMillDto): Promise<{
        email: string | null;
        name: string;
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        status: string;
        customer_id: string | null;
        phone: string | null;
        address: string | null;
    }>;
    update(id: string, dto: UpdateMillDto): Promise<{
        email: string | null;
        name: string;
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        status: string;
        customer_id: string | null;
        phone: string | null;
        address: string | null;
    }>;
    remove(id: string): Promise<{
        email: string | null;
        name: string;
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        status: string;
        customer_id: string | null;
        phone: string | null;
        address: string | null;
    }>;
}
