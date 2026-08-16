import { MillsService } from './mills.service';
export declare class MobileMillsController {
    private readonly millsService;
    constructor(millsService: MillsService);
    findAll(customerId?: string, skip?: string, take?: string, search?: string, refNo?: string, frameNo?: string): Promise<any>;
    findByCustomer(customerId: string, search?: string): Promise<any>;
    findOne(id: string): Promise<any>;
}
