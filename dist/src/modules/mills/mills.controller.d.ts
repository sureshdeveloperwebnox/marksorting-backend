import { MillsService } from './mills.service';
import { CreateMillDto } from './dto/create-mill.dto';
import { UpdateMillDto } from './dto/update-mill.dto';
export declare class MillsController {
    private readonly millsService;
    constructor(millsService: MillsService);
    findAll(skip?: string, take?: string, search?: string, refNo?: string, frameNo?: string, status?: string, customerId?: string): Promise<any>;
    findOne(id: string): Promise<any>;
    create(dto: CreateMillDto): Promise<{
        customer_id: string | null;
        name: string;
        ref_no: string | null;
        email: string | null;
        phone: string | null;
        phone_2: string | null;
        phone_3: string | null;
        address: string | null;
        place: string | null;
        city: string | null;
        status: string;
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
    }>;
    update(id: string, dto: UpdateMillDto): Promise<{
        before: {
            customer_id: string | null;
            name: string;
            ref_no: string | null;
            email: string | null;
            phone: string | null;
            phone_2: string | null;
            phone_3: string | null;
            address: string | null;
            place: string | null;
            city: string | null;
            status: string;
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
        };
        after: {
            customer_id: string | null;
            name: string;
            ref_no: string | null;
            email: string | null;
            phone: string | null;
            phone_2: string | null;
            phone_3: string | null;
            address: string | null;
            place: string | null;
            city: string | null;
            status: string;
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
        };
    }>;
    remove(id: string): Promise<{
        customer_id: string | null;
        name: string;
        ref_no: string | null;
        email: string | null;
        phone: string | null;
        phone_2: string | null;
        phone_3: string | null;
        address: string | null;
        place: string | null;
        city: string | null;
        status: string;
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
    }>;
}
