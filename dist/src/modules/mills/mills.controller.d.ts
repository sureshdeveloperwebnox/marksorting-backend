import { MillsService } from './mills.service';
import { CreateMillDto } from './dto/create-mill.dto';
import { UpdateMillDto } from './dto/update-mill.dto';
export declare class MillsController {
    private readonly millsService;
    constructor(millsService: MillsService);
    findAll(skip?: string, take?: string, search?: string, refNo?: string, frameNo?: string, status?: string, customerId?: string): Promise<any>;
    findOne(id: string): Promise<any>;
    create(dto: CreateMillDto): Promise<{
        id: string;
        created_at: Date;
        email: string | null;
        updated_at: Date;
        deleted_at: Date | null;
        name: string;
        place: string | null;
        status: string;
        phone: string | null;
        address: string | null;
        customer_id: string | null;
        ref_no: string | null;
        city: string | null;
        phone_2: string | null;
        phone_3: string | null;
    }>;
    update(id: string, dto: UpdateMillDto): Promise<{
        before: {
            id: string;
            created_at: Date;
            email: string | null;
            updated_at: Date;
            deleted_at: Date | null;
            name: string;
            place: string | null;
            status: string;
            phone: string | null;
            address: string | null;
            customer_id: string | null;
            ref_no: string | null;
            city: string | null;
            phone_2: string | null;
            phone_3: string | null;
        };
        after: {
            id: string;
            created_at: Date;
            email: string | null;
            updated_at: Date;
            deleted_at: Date | null;
            name: string;
            place: string | null;
            status: string;
            phone: string | null;
            address: string | null;
            customer_id: string | null;
            ref_no: string | null;
            city: string | null;
            phone_2: string | null;
            phone_3: string | null;
        };
    }>;
    remove(id: string): Promise<{
        id: string;
        created_at: Date;
        email: string | null;
        updated_at: Date;
        deleted_at: Date | null;
        name: string;
        place: string | null;
        status: string;
        phone: string | null;
        address: string | null;
        customer_id: string | null;
        ref_no: string | null;
        city: string | null;
        phone_2: string | null;
        phone_3: string | null;
    }>;
}
