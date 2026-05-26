import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
export declare class CustomersController {
    private readonly customersService;
    constructor(customersService: CustomersService);
    findAll(skip?: string, take?: string, search?: string, status?: string): Promise<any>;
    findOne(id: string): Promise<any>;
    create(dto: CreateCustomerDto): Promise<{
        email: string | null;
        name: string;
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        status: string;
        phone: string | null;
        address: string | null;
    }>;
    update(id: string, dto: UpdateCustomerDto): Promise<{
        email: string | null;
        name: string;
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        status: string;
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
        phone: string | null;
        address: string | null;
    }>;
}
