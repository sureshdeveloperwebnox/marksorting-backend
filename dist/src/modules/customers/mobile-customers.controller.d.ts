import { CustomersService } from './customers.service';
export declare class MobileCustomersController {
    private readonly customersService;
    constructor(customersService: CustomersService);
    findAll(skip?: string, take?: string, search?: string, status?: string): Promise<any>;
}
