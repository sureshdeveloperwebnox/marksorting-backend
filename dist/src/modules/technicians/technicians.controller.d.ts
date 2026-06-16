import { TechniciansService } from './technicians.service';
export declare class TechniciansController {
    private readonly techniciansService;
    constructor(techniciansService: TechniciansService);
    findAll(skip?: string, take?: string, search?: string, status?: string): Promise<any>;
    findOne(id: string): Promise<any>;
    updateStatus(id: string, status: string): Promise<{
        id: string;
        created_at: Date;
        full_name: string;
        email: string | null;
        updated_at: Date;
        deleted_at: Date | null;
        status: string;
        phone: string | null;
    }>;
}
