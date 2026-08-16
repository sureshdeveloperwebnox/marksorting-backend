import { TechniciansService } from './technicians.service';
export declare class MobileTechniciansController {
    private readonly techniciansService;
    constructor(techniciansService: TechniciansService);
    findAll(skip?: string, take?: string, search?: string, status?: string): Promise<any>;
}
