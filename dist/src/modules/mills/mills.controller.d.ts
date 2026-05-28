import { MillsService } from './mills.service';
import { CreateMillDto } from './dto/create-mill.dto';
import { UpdateMillDto } from './dto/update-mill.dto';
export declare class MillsController {
    private readonly millsService;
    constructor(millsService: MillsService);
    findAll(skip?: string, take?: string, search?: string, status?: string, customerId?: string): Promise<any>;
    findOne(id: string): Promise<any>;
    create(dto: CreateMillDto): Promise<{
        created_at: Date;
        id: string;
        name: string;
        email: string | null;
        phone: string | null;
        address: string | null;
        status: string;
        updated_at: Date;
        deleted_at: Date | null;
        customer_id: string | null;
    }>;
    update(id: string, dto: UpdateMillDto): Promise<{
        before: {
            created_at: Date;
            id: string;
            name: string;
            email: string | null;
            phone: string | null;
            address: string | null;
            status: string;
            updated_at: Date;
            deleted_at: Date | null;
            customer_id: string | null;
        };
        after: {
            created_at: Date;
            id: string;
            name: string;
            email: string | null;
            phone: string | null;
            address: string | null;
            status: string;
            updated_at: Date;
            deleted_at: Date | null;
            customer_id: string | null;
        };
    }>;
    remove(id: string): Promise<{
        created_at: Date;
        id: string;
        name: string;
        email: string | null;
        phone: string | null;
        address: string | null;
        status: string;
        updated_at: Date;
        deleted_at: Date | null;
        customer_id: string | null;
    }>;
}
