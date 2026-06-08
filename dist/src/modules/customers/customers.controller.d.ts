import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
export declare class CustomersController {
    private readonly customersService;
    constructor(customersService: CustomersService);
    findAll(skip?: string, take?: string, search?: string, status?: string): Promise<any>;
    findOne(id: string): Promise<any>;
    create(dto: CreateCustomerDto): Promise<{
        id: string;
        created_at: Date;
        email: string | null;
        updated_at: Date;
        deleted_at: Date | null;
        name: string;
        phone: string | null;
        status: string;
        address: string | null;
    }>;
    update(id: string, dto: UpdateCustomerDto): Promise<{
        before: {
            id: string;
            created_at: Date;
            email: string | null;
            updated_at: Date;
            deleted_at: Date | null;
            name: string;
            phone: string | null;
            status: string;
            address: string | null;
        };
        after: {
            id: string;
            created_at: Date;
            email: string | null;
            updated_at: Date;
            deleted_at: Date | null;
            name: string;
            phone: string | null;
            status: string;
            address: string | null;
        };
    }>;
    remove(id: string): Promise<{
        id: string;
        created_at: Date;
        email: string | null;
        updated_at: Date;
        deleted_at: Date | null;
        name: string;
        phone: string | null;
        status: string;
        address: string | null;
    }>;
}
