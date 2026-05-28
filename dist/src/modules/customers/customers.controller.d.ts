import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
export declare class CustomersController {
    private readonly customersService;
    constructor(customersService: CustomersService);
    findAll(skip?: string, take?: string, search?: string, status?: string): Promise<any>;
    findOne(id: string): Promise<any>;
    create(dto: CreateCustomerDto): Promise<{
        created_at: Date;
        id: string;
        name: string;
        email: string | null;
        phone: string | null;
        address: string | null;
        status: string;
        updated_at: Date;
        deleted_at: Date | null;
    }>;
    update(id: string, dto: UpdateCustomerDto): Promise<{
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
    }>;
}
