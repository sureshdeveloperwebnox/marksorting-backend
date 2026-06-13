import { ServiceCategoriesService } from './service-categories.service';
export declare class MobileServiceCategoriesController {
    private readonly serviceCategoriesService;
    constructor(serviceCategoriesService: ServiceCategoriesService);
    findAll(skip?: string, take?: string, search?: string): Promise<any>;
}
