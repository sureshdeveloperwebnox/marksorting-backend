import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
export declare class CustomersController {
    private readonly customersService;
    constructor(customersService: CustomersService);
    findAll(skip?: string, take?: string, search?: string, status?: string): Promise<any>;
    findOne(id: string): Promise<any>;
    create(dto: CreateCustomerDto): Promise<any>;
    update(id: string, dto: UpdateCustomerDto): Promise<{
        before: any;
        after: any;
    }>;
    remove(id: string): Promise<any>;
}
