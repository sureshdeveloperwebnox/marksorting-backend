import { TechniciansService } from './technicians.service';
export declare class TechniciansController {
    private readonly techniciansService;
    constructor(techniciansService: TechniciansService);
    findAll(skip?: string, take?: string, search?: string, status?: string): Promise<any>;
    findOne(id: string): Promise<any>;
    updateStatus(id: string, status: string): Promise<{
        id: string;
        status: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        full_name: string;
        email: string | null;
        phone: string | null;
    }>;
}
